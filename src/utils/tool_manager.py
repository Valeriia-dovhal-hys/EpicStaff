import yaml
import os

tools_paths_file = "config/tools_paths.yaml"
tools_config_file = "config/tools_config.yaml"
callables_paths_file = 'config/callables_paths.yaml'

def load_yaml_file(file_path):
    
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return yaml.safe_load(f)
    else:
        raise FileNotFoundError(f"{file_path} not found.")

def resolve_callable_paths(callable_config, callables_paths):

    if isinstance(callable_config, dict) and 'callable_name' in callable_config:
        callable_name = callable_config['callable_name']
        if callable_name in callables_paths:
            callable_config['path'] = callables_paths[callable_name]
        
        if 'kwargs' in callable_config:
            for key, value in callable_config['kwargs'].items():
                if isinstance(value, dict):
                    callable_config['kwargs'][key] = resolve_callable_paths(value, callables_paths)
                    
    return callable_config

def create_tools_dict(tools_config_file, tools_paths_file, callables_paths_file):

    tools_config = load_yaml_file(tools_config_file)
    tools_paths = load_yaml_file(tools_paths_file)
    callables_paths = load_yaml_file(callables_paths_file)

    tools_dict = {}

    for tool_name, tool_data in tools_config.items():
        tool_class_name = tool_data.get('tool_class_name')

        tool_path = tools_paths.get(tool_class_name, None)

        tools_dict[tool_name] = {
            "class_name": tool_class_name,
            "path": tool_path,
            "args": tool_data.get("args", []),
            "kwargs": tool_data.get("kwargs", {}),
            "dependencies": tool_data.get("dependencies", [])
        }

        for key, value in tools_dict[tool_name]["kwargs"].items():
            if isinstance(value, dict):
                tools_dict[tool_name]["kwargs"][key] = resolve_callable_paths(value, callables_paths)

    return tools_dict

if __name__ == "__main__":
    d = create_tools_dict(tools_config_file, tools_paths_file, callables_paths_file)
