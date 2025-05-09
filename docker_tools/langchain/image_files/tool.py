from importlib import import_module
import os
from typing import Type
from dotenv import load_dotenv
from base_models import Callable, ImportToolData
from parse_model_data import parse_callable
from pickle_encode import txt_to_obj, obj_to_txt

# ------------------------
# TODO: uncoment this code and comment the one below (after changing logic)
# ------------------------
# load_dotenv()
# callable_txt = os.environ.get("CALLABLE")
# tool_run_params_txt = os.environ.get("TOOL_RUN_PARAMS")
# callable_tool: Callable = txt_to_obj(callable_txt)
# run_args, run_kwargs = txt_to_obj(tool_run_params_txt)
# tool_class, args, kwargs = parse_callable(callable_tool)
# tool = tool_class(*args, **kwargs)
# res = tool._run(*run_args, **run_kwargs)
# print(res)

td = ImportToolData(
    callable=Callable(
        module_path="langchain_community.tools.wikipedia.tool",
        class_name="WikipediaQueryRun",
        kwargs={
            "api_wrapper": Callable(
                module_path="langchain_community.utilities.wikipedia",
                class_name="WikipediaAPIWrapper",
            )
        },
    )
)
tool_class, args, kwargs = parse_callable(td.callable)
tool = tool_class(*args, **kwargs)


tool_dict = tool.dict(include={"name", "description", "args_schema"})

from langchain_core.tools import BaseTool


if "args_schema" in tool_dict.keys():
    if tool_dict["args_schema"] is None:
        tool_dict.pop("args_schema", None)


def my_run(self, *args, **kwargs):
    return tool._run(*args, **kwargs)


new_class_tuple = "CustomTool", (BaseTool,), {**tool_dict, "_run": my_run}

# TRANSFER
txt = obj_to_txt(new_class_tuple)
nct = txt_to_obj(txt)

MyCustomTool = type(*nct)
mct = MyCustomTool()

res = mct._run(query="Hate")


print(res)
