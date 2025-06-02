from utils.singleton_meta import SingletonMeta
from tables.models import Session, Task, Crew
from tables.serializers.nested_model_serializers import (
    NestedSessionSerializer,
    NestedTaskSerializer,
)

from tables.services.redis_service import RedisService


class SessionRunnerService(metaclass=SingletonMeta):

    def run_session(self, session_id):

        session = Session.objects.get(pk=session_id)
        serialized_session = NestedSessionSerializer(session).data

        crew_id = serialized_session["crew"]["id"]
        tasks = Task.objects.filter(crew=crew_id)
        serialized_task_list = NestedTaskSerializer(tasks, many=True).data

        serialized_session["crew"]["tasks"] = serialized_task_list

        RedisService.putSessionSchemaOnRedis(session_id, serialized_session)
