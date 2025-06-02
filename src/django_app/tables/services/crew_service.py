from django.forms.models import model_to_dict
from rest_framework.utils.serializer_helpers import ReturnDict

from tables.models import Crew, Task
from tables.serializers.nested_model_serializers import (
    NestedCrewSerializer,
    NestedTaskSerializer,
)
import json


class CrewService:

    def __init__(self): ...

    def create_crew_schema_json(self, crew_id: int) -> str:

        crew = Crew.objects.get(pk=crew_id)
        serialized_crew = NestedCrewSerializer(crew).data

        serialized_crew = self.inject_tasks(serialized_crew)

        return json.dumps(serialized_crew)


    def inject_tasks(self, crew_schema: ReturnDict) -> ReturnDict:

        crew_id = crew_schema["id"]
        tasks = Task.objects.filter(crew=crew_id)
        task_list = NestedTaskSerializer(tasks, many=True).data

        crew_schema["tasks"] = task_list

        return crew_schema
