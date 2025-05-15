import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
import requests

import docker
from docker.models.containers import Container

from .models.request_models import RunCrewModel

docker.from_env()
client: Container = docker.client

app = FastAPI()


@app.post("/crew/run", status_code=200)
async def run_crew(run_crew_model: RunCrewModel):
    return 





if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
