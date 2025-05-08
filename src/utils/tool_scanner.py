import os
import yaml
import importlib
import importlib.metadata
import pkgutil

from utils.tools_hasher import ToolsHasher

class ToolScanner:

    tools_config_path = "config/tools_config.yaml"
    tools_paths_path = "config/tools_paths.yaml"
    hasher = ToolsHasher()

    @staticmethod
    def get_installed_packages():
        packages = {}
        for dist in importlib.metadata.distributions():
            name = dist.metadata.get('Name')
            version = dist.version
            if name and version:
                packages[name] = version
        return packages

    @classmethod
    def load_tools_names(cls):
        if os.path.exists(cls.tools_config_path):
            with open(cls.tools_config_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            raise FileNotFoundError(f"{cls.tools_config_path} not found.")

    @classmethod
    def save_tools_paths(cls, tools_paths):
        with open(cls.tools_config_path, 'w') as f:
            yaml.dump(tools_paths, f)

    @classmethod
    def load_tools_paths(cls):
        if os.path.exists(cls.tools_config_path):
            with open(cls.tools_config_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            return {}

    @classmethod
    def find_tools(cls, tools_names, target_packages):
        tools_paths = {}

        for package_name in target_packages:
            try:
                package = importlib.import_module(package_name)
                pkg_name = package.__name__
                pkg_path = package.__path__
                for module_info in pkgutil.walk_packages(pkg_path, pkg_name + '.'):
                    try:
                        module = importlib.import_module(module_info.name)
                        for tool_details in tools_names.values():
                            tool_class_name = tool_details["class_name"]
                            if hasattr(module, tool_class_name):
                                cls = getattr(module, tool_class_name)
                                if isinstance(cls, type):
                                    full_path = f"{module.__name__}.{tool_class_name}"
                                    tools_paths[tool_class_name] = full_path
                            elif module_info.ispkg:
                                tools_paths.update(cls.find_tools(tools_names, [module_info.name]))
                    except (ImportError, AttributeError, ModuleNotFoundError) as e:
                        continue
            except ImportError as e:
                print(f"Error importing package {package_name}: {e}")
                continue

        return tools_paths

    @classmethod
    def scan_and_update_tools_paths(cls):
        tools_names = ToolScanner.load_tools_names()

        lctools = "langchain_community.tools"
        lcutils = "langchain_community.utilities"
        crewai_tools = "crewai_tools"
        tools_paths = cls.find_tools(tools_names, [lctools, lcutils, crewai_tools])
        cls.save_tools_paths(tools_paths)

    @classmethod
    def update_hash_if_needed(cls):
        packages = cls.get_installed_packages()
        current_hash = cls.hasher.compute_packages_hash(packages)
        saved_hash = cls.hasher.load_saved_hash()
        if current_hash != saved_hash:
            cls.hasher.save_current_hash(current_hash)
            return True
        return False

    @classmethod
    def perform_scanning(cls):
        packages_changed = cls.update_hash_if_needed()
        if packages_changed or not os.path.exists(cls.tools_config_path):
            print("Packages have changed or tools paths not found. Scanning for classes...")
            cls.scan_and_update_tools_paths()


