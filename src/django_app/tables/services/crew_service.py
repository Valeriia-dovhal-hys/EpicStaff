from django.forms.models import model_to_dict
from rest_framework.utils.serializer_helpers import ReturnDict

from utils.singleton_meta import SingletonMeta
from tables.models import Crew, Task
from tables.serializers.nested_model_serializers import (
    NestedCrewSerializer,
    NestedTaskSerializer,
)
import json


class CrewService(metaclass=SingletonMeta):

    def __init__(self): ...


    def inject_tasks(self, crew_schema: ReturnDict) -> ReturnDict:

        crew_id = crew_schema["id"]
        tasks = Task.objects.filter(crew=crew_id)
        task_list = NestedTaskSerializer(tasks, many=True).data

        crew_schema["tasks"] = task_list

        return crew_schema
