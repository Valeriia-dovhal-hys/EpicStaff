from pathlib import Path

from crewai import Crew
from services.redis_service import RedisService
from models.request_models import CrewData, SessionData
from services.crew_parser import CrewParser
from utils.helpers import load_env
from utils.helpers import logger


class RunCrewService:
    def __init__(
        self,
        redis_service: RedisService,
    ):
        self.redis_service = redis_service
        self.crew_parser = CrewParser()

    def run(self):
        logger.info("Starting RunCrewService run method.")

        json_session_schema = self.redis_service.get_json_session_schema()

        session_data: SessionData = SessionData.model_validate_json(json_session_schema)
        crew_data: CrewData = session_data.crew
        logger.info("Session data validated and crew data extracted.")

        config_path = Path("env_config/config.yaml").resolve().as_posix()
        load_env(config_path)

        crew: Crew = self.crew_parser.parse_crew(crew_data=crew_data)
        logger.info("Crew parsed successfully from crew data.")

        kickoff_result = crew.kickoff()

        result = kickoff_result.to_dict()
        self.redis_service.publish_final_result(result)
