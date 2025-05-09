import os
from dotenv import load_dotenv
from fastapi import FastAPI
from base_models import RunToolModel
from tool import get_tool_data, create_tool, run_tool
from pickle_encode import obj_to_txt, txt_to_obj
import uvicorn

app = FastAPI()
load_dotenv()
callable_txt = os.environ.get("CALLABLE")
tool = create_tool(callable_txt=callable_txt)

map_tool = dict()

@app.get("/tool/class-data", status_code=200)
async def get_class_data():
    tool_data = get_tool_data(tool)
    txt = obj_to_txt(tool_data)
    return {"classdata": txt}


@app.post("/tool/run", status_code=200)
async def run(run_model: RunToolModel):
    result = run_tool(tool, run_model.run_params_txt)
    
    return {"data": result}



if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
