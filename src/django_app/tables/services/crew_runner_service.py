from tables.models import Crew, Task
from tables.services.session_manager_service import SessionManagerService
from tables.services.manager_container_service import ManagerContainerService
from django.forms.models import model_to_dict
from tables.serializers.nested_model_serializers import (
    NestedCrewSerializer,
    NestedTaskSerializer,
)


class CrewRunnerService:

    def __init__(
            self,
            session_manager_service: SessionManagerService,
            manager_container_service: ManagerContainerService
    ) -> None:
        self.session_manager_service = session_manager_service
        self.manager_container_service = manager_container_service

    def run_crew(self, crew_id) -> int:

        crew = Crew.objects.get(pk=crew_id)
        serialized_crew = NestedCrewSerializer(crew).data
        tasks = Task.objects.filter(crew=crew_id)
        serialized_task_list = NestedTaskSerializer(tasks, many=True).data

        serialized_crew["tasks"] = serialized_task_list
        response = self.manager_container_service.run_crew(serialized_crew)

        session = self.session_manager_service.create_session(crew_id=crew_id)
        return session.pk
