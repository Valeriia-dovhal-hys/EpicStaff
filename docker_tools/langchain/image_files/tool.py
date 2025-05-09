from importlib import import_module
import json
import os
from typing import Type
from dotenv import load_dotenv
from base_models import Callable, ImportToolData
from parse_model_data import parse_callable
from pickle_encode import txt_to_obj, obj_to_txt
from langchain_core.tools import BaseTool
from pydantic.v1 import BaseModel as V1BaseModel

load_dotenv()
callable_txt = os.environ.get("CALLABLE")
callable_tool: Callable = txt_to_obj(callable_txt)


def run_tool(tool, tool_run_params_txt):
    run_args, run_kwargs = txt_to_obj(tool_run_params_txt)
    return tool._run(*run_args, **run_kwargs)


def create_tool(callable_txt: str) -> BaseTool:
    callable_tool: Callable = txt_to_obj(callable_txt)
    tool_class, args, kwargs = parse_callable(callable_tool)
    tool = tool_class(*args, **kwargs)
    return tool


def get_tool_data(tool):
    tool_dict = tool.dict(include={"name", "description", "args_schema"})

    if "args_schema" in tool_dict.keys():
        if tool_dict["args_schema"] is None:
            # tool_dict.pop("args_schema", None)
            from langchain_core.tools import create_schema_from_function

            tool_dict["args_schema"] = create_schema_from_function(
                model_name=tool.__class__.__name__, func=tool._run
            )

    schema: Type[V1BaseModel] = tool_dict["args_schema"]


    tool_dict["args_schema_json_schema"] = json.dumps(schema.schema())
    tool_dict.pop("args_schema")


    return tool_dict  # tool.my_run

