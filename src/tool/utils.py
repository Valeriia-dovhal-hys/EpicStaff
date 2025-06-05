from dotenv import load_dotenv
import json
import os
from typing import Any, Type
from dotenv import load_dotenv
from base_models import Callable
from pickle_encode import txt_to_obj
from langchain_core.tools import BaseTool
from pydantic.v1 import BaseModel as V1BaseModel
from langchain_core.tools import create_schema_from_function
from parse_model_data import CallableParser

cp: CallableParser = CallableParser()


def init_tools():
    load_dotenv()
    tool_alias_callable_dict_txt = os.environ.get("ALIAS_CALLABLE")
    tool_alias_callable_dict: dict[str, Callable] = txt_to_obj(
        tool_alias_callable_dict_txt
    )

    tool_alias_dict = dict()
    for k, v in tool_alias_callable_dict.items():
        tool_alias_dict[k] = create_tool(v)
    return tool_alias_dict


def run_tool(tool, run_args: list[str], run_kwargs: dict[str, Any]):

    return tool._run(*run_args, **run_kwargs)


def create_tool(callable: Callable) -> BaseTool:

    return cp.eval_callable(callable=callable)


def get_tool_data(tool) -> dict:
    tool_dict = tool.dict(include={"name", "description", "args_schema"})

    if "args_schema" in tool_dict.keys():
        if tool_dict["args_schema"] is None:

            tool_dict["args_schema"] = create_schema_from_function(
                model_name=tool.__class__.__name__, func=tool._run
            )

    schema: Type[V1BaseModel] = tool_dict["args_schema"]

    tool_dict["args_schema_json_schema"] = json.dumps(schema.schema())
    tool_dict.pop("args_schema")

    return tool_dict
