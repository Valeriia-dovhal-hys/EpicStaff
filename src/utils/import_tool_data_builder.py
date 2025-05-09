import json
from typing import Any, List, Dict, Optional
from pydantic import BaseModel

class Callable(BaseModel):
    module_path: str
    class_name: str
    args: Optional[List[Any]] = None
    kwargs: Optional[Dict[str, Any]] = None

class ImportClassData(BaseModel):
    callable: Callable
    dependencies: Optional[List[str]] = None
    force_build: bool = False

class ImportToolDataBuilder:

    tools_config_path = "config/tools_config.json"
    tools_paths_path = "config/tools_paths.json"

    def __init__(self, tools_config_path=None, tools_paths_path=None):
        if tools_config_path:
            self.tools_config_path = tools_config_path
        if tools_paths_path:
            self.tools_paths_path = tools_paths_path

    def process_value(self, value: Any) -> Any:
        if isinstance(value, dict):
            if 'callable_name' in value:
                return self.process_callable(value)
            else:
                return {k: self.process_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [self.process_value(item) for item in value]
        else:
            return value
        
    def process_callable(self, callable_data: Dict[str, Any]) -> Callable:
        callable_name = callable_data['callable_name']
        module_path = self.tools_paths.get(callable_name)
        if not module_path:
            raise ValueError(f"Module path for class '{callable_name}' not found in tools_paths.json.")
        
        args = callable_data.get('args')
        kwargs = callable_data.get('kwargs')
        
        processed_args = self.process_value(args) if args else None
        processed_kwargs = self.process_value(kwargs) if kwargs else None
        
        return Callable(
            module_path=module_path,
            class_name=callable_name,
            args=processed_args,
            kwargs=processed_kwargs
        )

    def get_import_class_data(self, key: str) -> ImportClassData:
        with open(self.tools_config_path, 'r') as f:
            self.tools_config = json.load(f)
        
        with open(self.tools_paths_path, 'r') as f:
            self.tools_paths = json.load(f)
        
        data = self.tools_config.get(key)
        if not data:
            raise ValueError(f"Key '{key}' not found in the configuration.")
        
        class_name = data['class_name']
        module_path = self.tools_paths.get(class_name)
        if not module_path:
            raise ValueError(f"Module path for class '{class_name}' not found in tools_paths.json.")
        
        args = data.get('args')
        kwargs = data.get('kwargs')
        dependencies = data.get('dependencies')
        
        processed_args = self.process_value(args) if args else None
        processed_kwargs = self.process_value(kwargs) if kwargs else None
        
        main_callable = Callable(
            module_path=module_path,
            class_name=class_name,
            args=processed_args,
            kwargs=processed_kwargs
        )
        
        return ImportClassData(
            callable=main_callable,
            dependencies=dependencies,
            force_build = False
        )

if __name__ == "__main__":
    itdb = ImportToolDataBuilder()
    import_class_data = itdb.get_import_class_data("wolfram_alpha")

    print(import_class_data)