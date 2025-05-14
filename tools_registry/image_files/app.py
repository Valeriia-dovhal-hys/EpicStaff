import json
import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
from fastapi.responses import JSONResponse
from models.models import (
    RunToolParamsModel,
    ToolListResponseModel,
    ClassDataResponseModel,
    RunToolResponseModel,
)
from repositories.import_tool_data_repository import ImportToolDataRepository
from services.tool_image_service import ToolImageService
from services.tool_container_service import (
    ToolContainerService,
)


import docker

docker.from_env()

app = FastAPI()
import_tool_data_repository = ImportToolDataRepository()

tool_image_service = ToolImageService(
    import_tool_data_repository=import_tool_data_repository
)
tool_container_service = ToolContainerService(
    tool_image_service=tool_image_service,
    import_tool_data_repository=import_tool_data_repository,
)
# TODO ADD LOGGER
# TODO add error handlers (if error in important request -send to some service)


@app.get("/tool/list", status_code=200, response_model=ToolListResponseModel)
def get_all_tool_aliases():

    return ToolListResponseModel(
        tool_list=import_tool_data_repository.get_tool_alias_list()
    )


@app.get(
    "/tool/{tool_alias}/class-data",
    status_code=200,
    response_model=ClassDataResponseModel,
)
def get_class_data(tool_alias: str):
    classdata = tool_container_service.request_class_data(tool_alias=tool_alias)[
        "classdata"
    ]
    return ClassDataResponseModel(classdata=classdata)


@app.post(
    "/tool/{tool_alias}/run", status_code=200, response_model=RunToolResponseModel
)
def run(tool_alias: str, run_tool_params_model: RunToolParamsModel):
    # logger.debug(f"run tool {tool_alias} with params {run_tool_params_model.dict()}")
    run_tool_data = tool_container_service.request_run_tool(
        tool_alias=tool_alias, run_tool_params_model=run_tool_params_model
    )["data"]
    return RunToolResponseModel(data=run_tool_data)


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True, workers=1)
