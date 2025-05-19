import os
from pathlib import Path
from celery import Celery
from crewai import Crew

from fastapi_app.models.request_models import CrewData
from fastapi_app.services.crew_parser import CrewParser
from utils.helpers import load_env


CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

app = Celery("tasks", broker=CELERY_BROKER_URL)
app.conf.result_backend = CELERY_RESULT_BACKEND


crew_parser = CrewParser()


@app.task
def kickoff(crew_data_json: str):
    crew_data = CrewData.model_validate_json(crew_data_json)

    load_env(Path("config/config.yaml").resolve().as_posix())

    crew: Crew = crew_parser.parse_crew(crew_data=crew_data)

    output = crew.kickoff()
    return output.raw
