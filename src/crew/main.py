from services.redis_service import RedisService
from services.container_manager_service import ContainerManagerService
from services.run_crew_service import RunCrewService


redis_service = RedisService()
container_manager_service = ContainerManagerService()

run_crew_service = RunCrewService(
    redis_service=RedisService, container_manager_service=container_manager_service
)


if __name__ == "__main__":
    run_crew_service.run()
