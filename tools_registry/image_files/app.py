import os
import time

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


def fetch_data_with_retry(url, retries=10, delay=3):
    for attempt in range(retries):
        try:
            print(f"Attempt {attempt + 1} to fetch data...")
            resp = requests.get(url)
            if resp.status_code == 200:
                return resp
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
        # Wait before retrying
        if attempt < retries - 1:
            time.sleep(delay)
    raise Exception(f"Failed to fetch data after {retries} attempts.")


@app.get("/tool/list", status_code=200)
async def get_all_classes_data(tool_alias: str):
    return


@app.get("/tool/{tool_alias}/class-data", status_code=200)
async def get_class_data(tool_alias: str):
    ibs = ToolImageBuilderService(Registry(), itdb)
    image = ibs.build_tool_alias(tool_alias)

    container = RunnerService().run_image(image=image, tool_alias=tool_alias, port=3001)

    response = fetch_data_with_retry(
        f"http://{tool_alias}:8000/tool/{tool_alias}/class-data/"
    )
    return response.json()


@app.post("/tool/{tool_alias}/run", status_code=200)
async def run(tool_alias: str, run_model: RunToolModel):
    return


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
