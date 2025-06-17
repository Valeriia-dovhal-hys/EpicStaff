import os
from fastapi import FastAPI, Response, status
from models.models import (
    RunToolParamsModel,
    ClassDataResponseModel,
    RunToolResponseModel,
)
from utils import get_tool_data, run_tool, init_tools
from pickle_encode import obj_to_txt
import uvicorn
from loguru import logger
from tool_factory import DynamicToolFactory, ToolNotFoundException

app = FastAPI()
tool_factory = DynamicToolFactory()

init_tools()



@app.get(
    "/tool/{tool_alias}/class-data/",
    status_code=200,
    response_model=ClassDataResponseModel,
)
def get_class_data(tool_alias: str):
    try:
        tool = tool_factory.create(tool_alias=tool_alias)
    except ToolNotFoundException as e:
        logger.error(f"Tool class not found by tool alias {tool_alias}")
        return Response(
            content=str(e),
            status_code=status.HTTP_404_NOT_FOUND,
        )

    tool_data = get_tool_data(tool)
    txt = obj_to_txt(tool_data)
    return ClassDataResponseModel(classdata=txt)


@app.post(
    "/tool/{tool_alias}/run", status_code=200, response_model=RunToolResponseModel
)
def run(tool_alias: str, run_tool_params_model: RunToolParamsModel):
    logger.debug(
        f"tool/{tool_alias}/run \nrun_tool_params_model: {run_tool_params_model}"
    )

    config_dict = (
        {"config": run_tool_params_model.tool_config.model_dump()}
        if run_tool_params_model.tool_config is not None
        else {}
    )

    tool = tool_factory.create(
        tool_alias=tool_alias,
        tool_kwargs=config_dict
    )

    result = run_tool(
        tool=tool,
        run_args=run_tool_params_model.run_args,
        run_kwargs=run_tool_params_model.run_kwargs,
    )

    return RunToolResponseModel(data=result)


if __name__ == "__main__":

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
