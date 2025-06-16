import os
import json

from utils.logger import logger
from services.redis_service import RedisService
from services.container_manager_service import ContainerManagerService
from services.run_crew_service import RunCrewService
from models.response_models import SessionStatus

container_manager_service = ContainerManagerService()

redis_service = RedisService(container_manager_service=container_manager_service)

run_crew_service = RunCrewService(
    redis_service=redis_service,
)


if __name__ == "__main__":
    try:
        logger.info("Starting RunCrewService...")
        run_crew_service.run()
    except Exception as e:
        logger.error(f"An error occurred while running RunCrewService: {e}")
        redis_service.publish_session_status(SessionStatus.ERROR)
    else:
        logger.info("RunCrewService completed successfully.")
        redis_service.publish_session_status(SessionStatus.END)
