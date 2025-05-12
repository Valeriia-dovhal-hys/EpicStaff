import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
import requests

from models.models import RunToolModel
from repositories.import_tool_data_repository import ImportToolDataRepository
from services.tool_image_service import ToolImageService
from services.tool_container_serivce import (
    ToolContainerService,
)
from services.registry import Registry

import docker
from docker.models.containers import Container

docker.from_env()
client: Container = docker.client

app = FastAPI()
registry = Registry()
import_tool_data_repository = ImportToolDataRepository()

tool_image_service = ToolImageService(
    registry=registry, 
    import_tool_data_repository=import_tool_data_repository
)
tool_container_service = ToolContainerService(
    tool_image_service=tool_image_service,
    import_tool_data_repository=import_tool_data_repository
)


@app.get("/tool/list", status_code=200)
async def get_all_tool_aliases(tool_alias: str):
    return


@app.get("/tool/{tool_alias}/class-data", status_code=200)
async def get_class_data(tool_alias: str):

    return tool_container_service.request_class_data(tool_alias=tool_alias)


@app.post("/tool/{tool_alias}/run", status_code=200)
async def run(tool_alias: str, run_tool_model: RunToolModel):

    return tool_container_service.request_run_tool(
        tool_alias=tool_alias, run_tool_model=run_tool_model
    )


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
