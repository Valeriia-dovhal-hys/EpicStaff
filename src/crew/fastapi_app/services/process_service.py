import os
from pathlib import Path
from crewai import Crew

from fastapi_app.models.request_models import CrewData
from fastapi_app.services.crew_parser import CrewParser
from utils.helpers import load_env
import multiprocessing as mp
from redis import Redis


class ProcessService:
    def __init__(self, redis_host=None):
        if redis_host is None:
            redis_host = os.environ.get("PROCESS_REDIS_HOST", "redis")
        self.redis_host = redis_host

        self.crew_parser = CrewParser()

    def target(self, crew_data_json: str):

        redis_client = Redis(decode_responses=True, host=self.redis_host)

        crew_data = CrewData.model_validate_json(crew_data_json)
        load_env(Path("env_config/config.yaml").resolve().as_posix())

        crew: Crew = self.crew_parser.parse_crew(crew_data=crew_data)

        output = crew.kickoff()
        redis_client.set(name=crew_data.id, value=output.raw)

    def run_process(self, crew_data_json: str):
        p = mp.Process(target=self.target, args=[crew_data_json])
        p.start()

    def get_result_by_id(self, crew_id):
        redis_client = Redis(decode_responses=True, host=self.redis_host)
        return redis_client.get(name=crew_id)
