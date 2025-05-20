import os
import time

from crewai import Crew
from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
from fastapi_app.celery_tasks.tasks import kickoff
from fastapi_app.models.request_models import RunCrewModel


app = FastAPI()


@app.post("/crew/run", status_code=200)
def run_crew(run_crew_model: RunCrewModel):
    result = kickoff.delay(run_crew_model.data.model_dump_json())
    return {"result": result.get(timeout=180)}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
