import json
import os
from pathlib import Path

from crewai import Crew
from models.request_models import CrewData
from services.crew_parser import CrewParser
from utils.helpers import load_env
import multiprocessing as mp
from redis import Redis



class ProcessService:
    def __init__(self, redis_host=None):
        if redis_host is None:
            redis_host = os.environ.get("PROCESS_REDIS_HOST", "redis")
        self.redis_host = redis_host

        self.crew_parser = CrewParser()
 

    def run_process(self, crew_data_json: str) -> None:
        p = mp.Process(target=self.target, args=[crew_data_json])
        p.start()

    def get_crew_output_json(self, crew_id: int):
        redis_client = Redis(decode_responses=True, host=self.redis_host)
        return redis_client.get(name=crew_id)


    def get_crew_output_data(self, redis_client: Redis, crew_id: int) -> dict:
        redis_data = redis_client.get(crew_id) 

        if redis_data is None:
            return dict()
        
        return json.loads(redis_data)


    def set_crew_output_data(self, redis_client: Redis, crew_id: int, data: dict) -> None:
        redis_client.set(crew_id, json.dumps(data))
    
    def clear_crew_output_data(self, redis_client: Redis, crew_id: int) -> None:
        redis_client.delete(crew_id)


    def target(self, crew_schema_json: str) -> None:

        redis_client = Redis(decode_responses=True, host=self.redis_host)

        crew_data = CrewData.model_validate_json(crew_schema_json)
        load_env(Path("env_config/config.yaml").resolve().as_posix())

        crew: Crew = self.crew_parser.parse_crew(crew_data=crew_data)

        # delete crew_data:
        self.clear_crew_output_data(redis_client=redis_client, crew_id=crew_data.id)


        kickoff_result = crew.kickoff()
        
        crew_output_data = self.get_crew_output_data(redis_client=redis_client, crew_id=crew_data.id)
        crew_output_data["result"] = kickoff_result.raw

        self.set_crew_output_data(redis_client=redis_client, crew_id=crew_data.id, data=crew_output_data)