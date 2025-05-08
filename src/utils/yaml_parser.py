import yaml
import os
import importlib


class YamlParser:

    callables_paths_file = 'config/callables_paths.yaml'

    def load_callables_paths(self, callables_paths_file):

        if os.path.exists(callables_paths_file):
            with open(callables_paths_file, 'r') as f:
                return yaml.safe_load(f)
        else:
            raise FileNotFoundError(f"{callables_paths_file} not found.")

    def var_constructor(self, loader, node):

        variable_name = loader.construct_scalar(node)
        return os.environ.get(variable_name, f"<undefined: {variable_name}>")

    def callable_constructor(self, loader, node):

        callable_name = loader.construct_scalar(node)
        callables_paths = self.load_callables_paths(self.callables_paths_file)

        if callable_name not in callables_paths:
            raise ValueError(f"Callable '{callable_name}' not found in callables_paths.yaml")

        callable_path = callables_paths[callable_name]
        module_path, callable_class_name = callable_path.rsplit('.', 1)

        module = importlib.import_module(module_path)

        callable_obj = getattr(module, callable_class_name)

        if callable(callable_obj):
            return callable_obj()
        else:
            raise ValueError(f"{callable_name} at {callable_path} is not callable")

