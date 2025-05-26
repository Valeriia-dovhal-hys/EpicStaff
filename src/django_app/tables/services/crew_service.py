from tables.models import Crew, Task

from django.forms.models import model_to_dict
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
        tasks = Task.objects.filter(crew=crew_id)
        serialized_task_list = NestedTaskSerializer(tasks, many=True).data

        serialized_crew["tasks"] = serialized_task_list

        return json.loads(serialized_crew)
