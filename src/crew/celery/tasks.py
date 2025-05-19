from pathlib import Path
from celery import Celery
from crewai import Crew

from src.crew.fastapi.models.request_models import CrewData
from src.crew.fastapi.services.crew_parser import CrewParser
from src.crew.utils.helpers import load_env

app = Celery("tasks", broker="redis://localhost:6379/0")  # TODO: set broker
app.conf.result_backend = "redis://localhost:6379/0"


crew_parser = CrewParser(tool_registry_port=8001, tool_registry_host="localhost")


@app.task
def kickoff(crew_data_json: str):
    crew_data = crew_data = CrewData.model_validate_json(crew_data_json)

    load_env(Path("config/config.yaml").resolve().as_posix())

    crew: Crew = crew_parser.parse_crew(crew_data=crew_data)

    output = crew.kickoff()
    return output.raw
