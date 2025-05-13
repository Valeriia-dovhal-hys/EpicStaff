from django_app.tables.services.session_manager_service import SessionManagerService


class CrewRunnerService:

    def __init__(self, session_service: SessionManagerService) -> None:
        self.session_serivice: SessionManagerService

    def run_crew(self, crew_id) -> int:
        session = self.session_serivice.create_session(crew_id=crew_id)
        
        return session.pk
