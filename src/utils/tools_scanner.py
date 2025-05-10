import os
import json
import importlib
import importlib.metadata
import pkgutil
import logging
from tools_hasher import ToolsHasher


class ToolsScanner:
    tools_config_path = "config/tools_config.json"
    tools_paths_path = "config/tools_paths.json"
    hasher = ToolsHasher()

    def __init__(self, tools_config_path=None, tools_paths_path=None):
        if tools_config_path:
            self.tools_config_path = tools_config_path
        if tools_paths_path:
            self.tools_paths_path = tools_paths_path

    def extract_callable_names(self, data):
        callable_names = set()
        if isinstance(data, dict):
            if "class_name" in data:
                callable_names.add(data["class_name"])
            if "callable_name" in data:
                callable_names.add(data["callable_name"])
            for key, value in data.items():
                callable_names.update(self.extract_callable_names(value))
        elif isinstance(data, list):
            for item in data:
                callable_names.update(self.extract_callable_names(item))
        return callable_names

    def load_tools_paths(self):
        """
        Load the previously saved tools paths from tools_paths_path JSON file.
        """
        if os.path.exists(self.tools_paths_path):
            with open(self.tools_paths_path, "r") as f:
                tools_paths = json.load(f)
                return tools_paths
        else:
            return {}

    def save_tools_paths(self, tools_paths):
        """
        Save the resolved tools paths to tools_paths_path.
        """
        with open(self.tools_paths_path, "w") as f:
            json.dump(tools_paths, f, indent=4)

    def find_tools(self, callable_names, target_packages):
        """
        Recursively search through the target packages for the tool classes and their paths.
        """
        tools_paths = {}

        for package_name in target_packages:
            try:
                package = importlib.import_module(package_name)
                pkg_name = package.__name__
                pkg_path = package.__path__
                for module_info in pkgutil.walk_packages(pkg_path, pkg_name + "."):
                    try:
                        module = importlib.import_module(module_info.name)
                        for callable_name in callable_names:
                            if hasattr(module, callable_name):
                                cls_obj = getattr(module, callable_name)
                                if isinstance(cls_obj, type):
                                    full_path = f"{module.__name__}"
                                    tools_paths[callable_name] = full_path
                        if module_info.ispkg:
                            nested_tools = self.find_tools(
                                callable_names, [module_info.name]
                            )
                            tools_paths.update(nested_tools)
                    except (ImportError, AttributeError, ModuleNotFoundError) as e:
                        continue
            except ImportError as e:
                # TODO: Need to log this error case here
                continue

        return tools_paths

    def load_tools_names(self):
        """
        Load tool names (i.e., class_name from the JSON file).
        """
        if os.path.exists(self.tools_config_path):
            with open(self.tools_config_path, "r") as f:
                tools_config = json.load(f)
                callable_names = self.extract_callable_names(tools_config)
                return callable_names
        else:
            raise FileNotFoundError(f"{self.tools_config_path} not found.")

    def scan_and_update_tools_paths(self):
        """
        Scan the packages for tools and update the dedicated file accordingly.
        """
        callable_names = self.load_tools_names()

        lctools = "langchain_community.tools"
        lcutils = "langchain_community.utilities"
        crewai_tools = "crewai_tools"
        custom_tools = "tools"

        target_packages = [lctools, lcutils, crewai_tools]
        tools_paths = self.find_tools(callable_names, target_packages)
        self.save_tools_paths(tools_paths)
        return tools_paths

    def get_installed_packages(self):
        """
        Retrieve a dictionary of installed packages and their versions.
        """
        packages = {}
        for dist in importlib.metadata.distributions():
            name = dist.metadata.get("Name")
            version = dist.version
            if name and version:
                packages[name] = version
        return packages

    def update_hash_if_needed(self):
        """
        Check if installed packages have changed by comparing package hashes. If changes are detected,
        save the new hash and trigger a tool scan.
        """
        packages = self.get_installed_packages()
        current_hash = self.hasher.compute_packages_hash(packages)
        saved_hash = self.hasher.load_saved_hash()

        if current_hash != saved_hash:
            self.hasher.save_current_hash(current_hash)
            return True
        return False

    def perform_scanning(self):
        """
        Perform the scanning process if packages have changed or if tools paths are missing.
        """
        packages_changed = self.update_hash_if_needed()
        if packages_changed or not os.path.exists(self.tools_paths_path):
            tools_paths = self.scan_and_update_tools_paths()
            return tools_paths
        else:
            return self.load_tools_paths()


if __name__ == "__main__":


    scanner = ToolsScanner()
    # TODO: Add logging

    if os.environ.get("IN_DOCKER"):
        tools_paths = scanner.load_tools_paths()
    else:
        tools_paths = scanner.perform_scanning()

    print(tools_paths)
