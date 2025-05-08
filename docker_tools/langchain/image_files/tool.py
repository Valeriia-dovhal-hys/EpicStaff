from importlib import import_module
import json
import os
from dotenv import load_dotenv

load_dotenv()

tool_module_path = os.environ.get("TOOL_MODULE_PATH")
tool_class_name = os.environ.get("TOOL_CLASS_NAME")

tool_module = import_module(tool_module_path)
tool_class = getattr(tool_module, tool_class_name)


tool_kwargs_string = os.environ.get("TOOL_KWARGS")

kwargs = dict()
if tool_kwargs_string:
    kwargs = json.loads(tool_kwargs_string)

# TODO: add args
result = tool_class()._run(**kwargs)
print(result)
