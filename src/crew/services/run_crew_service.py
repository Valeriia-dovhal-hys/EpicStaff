from pathlib import Path

from crewai import Crew
from services.redis_service import RedisService
from models.request_models import CrewData, SessionData
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

        json_session_schema = self.redis_service.get_json_session_schema()

        session_data: SessionData = SessionData.model_validate_json(json_session_schema)
        crew_data: CrewData = session_data.crew

        load_env(Path("env_config/config.yaml").resolve().as_posix())

        crew: Crew = self.crew_parser.parse_crew(crew_data=crew_data)

        kickoff_result = crew.kickoff()

        result = kickoff_result.to_dict()

        self.redis_service.publish_final_result(result)
