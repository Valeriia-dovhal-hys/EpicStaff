from django.apps import AppConfig


class TablesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tables"

    def ready(self):

        from tables.services.config_service import YamlConfigService
        from tables.services.crew_service import CrewService
        from tables.services.redis_service import RedisService
        from tables.services.session_manager_service import SessionManagerService
        from tables.services.session_runner_service import SessionRunnerService

        redis_service = RedisService()
        crew_service = CrewService()
        SessionRunnerService()
        SessionManagerService(
            redis_service=redis_service,
            crew_service=crew_service,
        )
        YamlConfigService()
