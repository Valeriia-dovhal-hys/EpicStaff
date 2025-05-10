import json
from typing import Any, List, Dict, Optional
from pathlib import Path

from pydantic import BaseModel
from docker_tools.base_models import Callable, ImportToolData

base_path = Path(__file__).resolve().parent


class ImportToolDataBuilder:

    tools_config_path = base_path / "tools_config.json"
    tools_paths_path = base_path / "tools_paths.json"

    def __init__(
        self, *, tools_config_path=None, tools_paths_path=None, force_build=False
    ):
        if tools_config_path:
            self.tools_config_path = tools_config_path
        if tools_paths_path:
            self.tools_paths_path = tools_paths_path

        self.force_build = force_build

    def process_value(self, value: Any) -> Any:
        if isinstance(value, dict):
            if "callable_name" in value:
                return self.process_callable(value)
            else:
                return {k: self.process_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [self.process_value(item) for item in value]
        else:
            return value

    def process_callable(self, callable_data: Dict[str, Any]) -> Callable:
        callable_name = callable_data["callable_name"]
        module_path = self.tools_paths.get(callable_name)
        package = callable_data.get("package")

        args = callable_data.get("args")
        kwargs = callable_data.get("kwargs")

        processed_args = self.process_value(args) if args else None
        processed_kwargs = self.process_value(kwargs) if kwargs else None

        return Callable(
            module_path=module_path,
            class_name=callable_name,
            package=package,
            args=processed_args,
            kwargs=processed_kwargs,
        )
    

    def get_tool_group(self, image_name: str):
        k = "image_name"
        v = image_name
        try:
            tool_group = next(filter(lambda tool_gr: tool_gr[k] == v, self.tools_config))
            return tool_group
        except StopIteration:
            raise ValueError(f"Incorrect key {image_name}")


    def get_import_class_data(self, image_name: str) -> ImportToolData:

        with open(self.tools_config_path, "r") as f:
            self.tools_config = json.load(f)

        with open(self.tools_paths_path, "r") as f:
            self.tools_paths = json.load(f)

        tool_group = self.get_tool_group(image_name)
        dependencies = tool_group.get("dependencies")
        tool_dict = {}

        for tool_alias, data in tool_group.get("tool_dict").items():

            class_name = data["class_name"]
            module_path = self.tools_paths.get(class_name)
            package = data.get("package")

            args = data.get("args")
            kwargs = data.get("kwargs")

            processed_args = self.process_value(args) if args else None
            processed_kwargs = self.process_value(kwargs) if kwargs else None

            main_callable = Callable(
                module_path=module_path,
                class_name=class_name,
                package=package,
                args=processed_args,
                kwargs=processed_kwargs,
            )

            tool_dict[tool_alias] = main_callable

        return ImportToolData(
            image_name=image_name,
            tool_dict=tool_dict,
            dependencies=dependencies,
            force_build=self.force_build,
        )


if __name__ == "__main__":
    itdb = ImportToolDataBuilder()
    import_class_data = itdb.get_import_class_data("wolfram_alpha")

    print(import_class_data)
