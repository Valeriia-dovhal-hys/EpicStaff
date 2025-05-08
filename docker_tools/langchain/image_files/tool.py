from importlib import import_module
import os
from dotenv import load_dotenv
from base_models import Callable, ImportToolData
from parse_model_data import parse_callable
from pickle_encode import txt_to_obj, obj_to_txt

load_dotenv()

callable_txt = os.environ.get("CALLABLE")
tool_run_params_txt = os.environ.get("TOOL_RUN_PARAMS")

callable_tool: Callable = txt_to_obj(callable_txt)
run_args, run_kwargs = txt_to_obj(tool_run_params_txt)


tool_class, args, kwargs = parse_callable(callable_tool)


tool = tool_class(*args, **kwargs)


res = tool._run(*run_args, **run_kwargs)
print(res)
