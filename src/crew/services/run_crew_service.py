from pathlib import Path

from crewai import Crew
from services.redis_service import RedisService
from models.request_models import CrewData
from services.crew_parser import CrewParser
from utils.helpers import load_env


class RunCrewService:
    def __init__(
        self,
        redis_service: RedisService,
    ):
        self.redis_service = redis_service
        self.crew_parser = CrewParser()

    def run(self):

        json_crew_schema = self.redis_service.get_json_crew_schema()

        crew_data = CrewData.model_validate_json(json_crew_schema)

        load_env(Path("env_config/config.yaml").resolve().as_posix())

        crew: Crew = self.crew_parser.parse_crew(crew_data=crew_data)

        kickoff_result = crew.kickoff()

        result = kickoff_result.to_dict()

        self.redis_service.publish(
            "final_result", {"crew_id": crew_data.id, "result": result}
        )
