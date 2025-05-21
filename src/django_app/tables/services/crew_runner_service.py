from tables.models import Crew, Task
from tables.services.session_manager_service import SessionManagerService
from tables.services.registry_container_service import RegistryContainerService
from django.forms.models import model_to_dict
from tables.serializers.nested_model_serializers import (
    NestedCrewSerializer,
    NestedTaskSerializer,
)


class CrewRunnerService:

    def __init__(
            self,
            session_manager_service: SessionManagerService,
            registry_container_service: RegistryContainerService
    ) -> None:
        self.session_manager_service = session_manager_service
        self.registry_container_service = registry_container_service

    def run_crew(self, crew_id) -> int:

        crew = Crew.objects.get(pk=crew_id)
        serialized_crew = NestedCrewSerializer(crew).data
        tasks = Task.objects.filter(crew=crew_id)
        serialized_task_list = NestedTaskSerializer(tasks, many=True).data

        serialized_crew["tasks"] = serialized_task_list
        response = self.registry_container_service.run_crew(serialized_crew)

        session = self.session_manager_service.create_session(crew_id=crew_id)
        return session.pk
