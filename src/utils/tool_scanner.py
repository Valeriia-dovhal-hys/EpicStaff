import os
import yaml
import importlib
import importlib.metadata
import pkgutil
from tools_hasher import ToolsHasher

callables_paths_file = "config/callables_paths.yaml"

class ToolScanner:

    tools_config_path = "config/tools_config.yaml"
    tools_paths_path = "config/tools_paths.yaml"
    hasher = ToolsHasher()

    def __init__(self, tools_config_file=None):
        if tools_config_file:
            self.tools_config_file = tools_config_file

    @staticmethod
    def get_installed_packages():
        """
        Retrieve a dictionary of installed packages and their versions.
        """
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

                yaml.add_constructor('!var', cls.var_constructor)
                yaml.add_constructor('!callable', cls.callable_constructor)
                return yaml.load(f, Loader=yaml.FullLoader)
        else:
            raise FileNotFoundError(f"{cls.tools_config_path} not found.")

    @staticmethod
    def var_constructor(loader, node):

        variable_name = loader.construct_scalar(node)
        return os.environ.get(variable_name, f"<undefined: {variable_name}>")

    @staticmethod
    def callable_constructor(loader, node):
        """
        Custom YAML constructor that resolves dynamic callables with nested parameters.
        """
        callable_node = loader.construct_mapping(node, deep=True)
        callable_name = callable_node['callable_name']

        callables_paths = ToolScanner.load_callables_paths()
        
        if callable_name not in callables_paths:
            raise ValueError(f"Callable '{callable_name}' not found in callables_paths.yaml")
        
        callable_path = callables_paths[callable_name]
        module_path, callable_class_name = callable_path.rsplit('.', 1)

        module = importlib.import_module(module_path)
        callable_obj = getattr(module, callable_class_name)

        if not callable(callable_obj):
            raise ValueError(f"{callable_name} at {callable_path} is not callable")
        
        kwargs = callable_node.get('kwargs', {})

        return callable_obj(**kwargs)

    @classmethod
    def load_callables_paths(cls):
        """
        Load the callables paths from callables_paths.yaml.
        """
        if os.path.exists(callables_paths_file):
            with open(callables_paths_file, 'r') as f:
                return yaml.safe_load(f)
        else:
            raise FileNotFoundError(f"{callables_paths_file} not found.")

    @classmethod
    def save_tools_paths(cls, tools_paths):
        """
        Save the resolved tools paths to tools_paths.yaml.
        """
        with open(cls.tools_paths_path, 'w') as f:
            yaml.dump(tools_paths, f)

    @classmethod
    def load_tools_paths(cls):
        """
        Load the previously saved tools paths from tools_paths.yaml.
        """
        if os.path.exists(cls.tools_paths_path):
            with open(cls.tools_paths_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            return {}

    @classmethod
    def find_tools(cls, tools_names, target_packages):
        """
        Recursively search through the target packages for the tool classes and their paths.
        """
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
                                cls_obj = getattr(module, tool_class_name)
                                if isinstance(cls_obj, type):
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
        """
        Scan the packages for tools and update dedicated file accordingly.
        """
        tools_names = ToolScanner.load_tools_names()

        lctools = "langchain_community.tools"
        lcutils = "langchain_community.utilities"
        crewai_tools = "crewai_tools"
        tools_paths = cls.find_tools(tools_names, [lctools, lcutils, crewai_tools])
        cls.save_tools_paths(tools_paths)

    @classmethod
    def update_hash_if_needed(cls):
        """
        Check if installed packages have changed by comparing package hashes. If changes are detected, 
        save the new hash and trigger a tool scan.
        """
        packages = cls.get_installed_packages()
        current_hash = cls.hasher.compute_packages_hash(packages)
        saved_hash = cls.hasher.load_saved_hash()
        if current_hash != saved_hash:
            cls.hasher.save_current_hash(current_hash)
            return True
        return False

    @classmethod
    def perform_scanning(cls):
        """
        Perform the scanning process if packages have changed or if tools paths are missing.
        """
        packages_changed = cls.update_hash_if_needed()
        if packages_changed or not os.path.exists(cls.tools_paths_path):
            print("Packages have changed or tools paths not found. Scanning for classes...")
            cls.scan_and_update_tools_paths()


if __name__ == "__main__":

    if os.environ.get('IN_DOCKER'):
        # TODO: Change prints to logging
        print("Running inside Docker. Loading precomputed class paths.")
        tools_paths = ToolScanner.load_tools_paths()
    else:
        print("Running in development. Performing scanning as needed.")
        tools_paths = ToolScanner.perform_scanning()

    print(tools_paths)