import os

from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
import requests

from models.models import RunToolModel
from repositories.import_tool_data_repository import ImportToolDataRepository
from services.tool_image_builder_service import ToolImageBuilderService
from services.runner_service import RunnerService
from services.registry import Registry

import docker
from docker.models.containers import Container

docker.from_env()
client: Container = docker.client

app = FastAPI()
itdb = ImportToolDataRepository()


@app.get("/tool/list", status_code=200)
async def get_all_classes_data(tool_alias: str):
    return


@app.get("/tool/{tool_alias}/class-data", status_code=200)
async def get_class_data(tool_alias: str):
    ibs = ToolImageBuilderService(Registry(), itdb)
    image = ibs.build_tool_alias(tool_alias)

    container = RunnerService().run_image(image=image, tool_alias=tool_alias, port=3001)
    

    response = requests.get(f"http://localhost:3001/tool/{tool_alias}/class-data/")
    return response


@app.post("/tool/{tool_alias}/run", status_code=200)
async def run(tool_alias: str, run_model: RunToolModel):
    return


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
