import os
import yaml
import importlib
import importlib.metadata
import pkgutil
import hashlib

TOOLS_CONFIG_PATH = "config/tools_config.yaml"
TOOLS_PATHS_PATH = "config/tools_paths.yaml"
HASH_FILE_PATH = "config/packages_hash.txt"

def get_installed_packages():
    packages = {}
    for dist in importlib.metadata.distributions():
        name = dist.metadata.get('Name')
        version = dist.version
        if name and version:
            packages[name] = version
    return packages

def compute_packages_hash(packages_dict):
    packages_list = sorted(f"{k}=={v}" for k, v in packages_dict.items())
    packages_str = '\n'.join(packages_list)
    return hashlib.md5(packages_str.encode('utf-8')).hexdigest()

def load_saved_hash():
    if os.path.exists(HASH_FILE_PATH):
        with open(HASH_FILE_PATH, 'r') as f:
            return f.read().strip()
    return None

def save_current_hash(hash_value):
    with open(HASH_FILE_PATH, 'w') as f:
        f.write(hash_value)

def load_tools_names():
    if os.path.exists(TOOLS_CONFIG_PATH):
        with open(TOOLS_CONFIG_PATH, 'r') as f:
            return yaml.safe_load(f)
    else:
        raise FileNotFoundError(f"{TOOLS_CONFIG_PATH} not found.")

def save_tools_paths(tools_paths):
    with open(TOOLS_PATHS_PATH, 'w') as f:
        yaml.dump(tools_paths, f)

def load_tools_paths():
    if os.path.exists(TOOLS_PATHS_PATH):
        with open(TOOLS_PATHS_PATH, 'r') as f:
            return yaml.safe_load(f)
    else:
        return {}

def find_tools(tools_names, target_packages):
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
                            tools_paths.update(find_tools(tools_names, [module_info.name]))
                except (ImportError, AttributeError, ModuleNotFoundError) as e:
                    continue
        except ImportError as e:
            print(f"Error importing package {package_name}: {e}")
            continue

    return tools_paths

def scan_and_update_tools_paths():
    tools_names = load_tools_names()

    lctools = "langchain_community.tools"
    lcutils = "langchain_community.utilities"
    crewai_tools = "crewai_tools"
    tools_paths = find_tools(tools_names, [lctools, lcutils, crewai_tools])
    save_tools_paths(tools_paths)

def update_hash_if_needed():
    packages = get_installed_packages()
    current_hash = compute_packages_hash(packages)
    saved_hash = load_saved_hash()
    if current_hash != saved_hash:
        save_current_hash(current_hash)
        return True
    return False

def perform_scanning():
    packages_changed = update_hash_if_needed()
    if packages_changed or not os.path.exists(TOOLS_PATHS_PATH):
        print("Packages have changed or tools paths not found. Scanning for classes...")
        scan_and_update_tools_paths()
