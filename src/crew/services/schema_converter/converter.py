import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from typing import Type
from datamodel_code_generator import InputFileType, generate
from datamodel_code_generator import DataModelType
from types import ModuleType
from pydantic import BaseModel


def generate_model_from_schema(schema_dict: dict) -> Type[BaseModel]:

    with TemporaryDirectory() as temporary_directory_name:
        temporary_directory = Path(temporary_directory_name)
        output = Path(temporary_directory / "model.py")
        generate(
            json.dumps(schema_dict),
            input_file_type=InputFileType.JsonSchema,
            output=output,
            # set up the output model types
            output_model_type=DataModelType.PydanticV2BaseModel,
        )
        class_definition: str = output.read_text()

    module_name = schema_dict["title"]

    dynamic_module = ModuleType(module_name)
    exec(class_definition, dynamic_module.__dict__)
    sys.modules[module_name] = dynamic_module
    return getattr(dynamic_module, module_name)


if __name__ == "__main__":
    json_schema: str = (
        '{"title": "MainModel", "type": "object", "properties": {"name": {"title": "Name", "default": "Some", "type": "string"}, "surname": {"title": "Surname", "type": "string"}, "age": {"title": "Age", "type": "integer"}}, "required": ["surname", "age"]}'
    )

    MainModel = generate_model_from_schema(json_schema)

    # Example usage
    main_model_instance = MainModel(surname="Doe", age=30)
    print(main_model_instance)
