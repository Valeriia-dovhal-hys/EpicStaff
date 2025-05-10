import os
from dotenv import load_dotenv
from fastapi import FastAPI
from base_models import Callable, RunToolModel
from tool import get_tool_data, create_tool, run_tool
from pickle_encode import obj_to_txt, txt_to_obj
import uvicorn

app = FastAPI()
load_dotenv()
tool_alias_callable_dict_txt = os.environ.get("ALIAS_CALLABLE")
tool_alias_callable_dict: dict[str, Callable] = txt_to_obj(tool_alias_callable_dict_txt)

tool_alias_dict = dict()
for k, v in tool_alias_callable_dict.items():
    tool_alias_dict[k] = create_tool(v)



@app.get("/tool/{tool_alias}/class-data/", status_code=200)
async def get_class_data(tool_alias: str):
    tool_data = get_tool_data(tool_alias_dict[tool_alias])
    txt = obj_to_txt(tool_data)
    return {"classdata": txt}


@app.post("/tool/{tool_alias}/run", status_code=200)
async def run(tool_alias: str, run_model: RunToolModel):
    result = run_tool(tool_alias_dict[tool_alias], run_model.run_params_txt)

    return {"data": result}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
