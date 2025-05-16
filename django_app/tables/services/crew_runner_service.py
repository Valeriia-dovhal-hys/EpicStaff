from tables.models import Crew
from .session_manager_service import SessionManagerService
from django.forms.models import model_to_dict
from tables.model_serializers import CrewSerializer


class CrewRunnerService:

    def __init__(self, session_manager_service: SessionManagerService) -> None:
        self.session_manager_service = session_manager_service

    def run_crew(self, crew_id) -> int:

        crew = Crew.objects.get(pk=crew_id)
        serialized_data = CrewSerializer(crew).data

        print(serialized_data)

        session = self.session_manager_service.create_session(crew_id=crew_id)
        return session.pk
    

