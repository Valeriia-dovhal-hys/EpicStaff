import json

from utils.singleton_meta import SingletonMeta
from tables.services.crew_service import CrewService
from tables.services.redis_service import RedisService
from tables.serializers.nested_model_serializers import NestedSessionSerializer
from tables.models import Session


class SessionManagerService(metaclass=SingletonMeta):

    def __init__(
        self,
        redis_service: RedisService,
        crew_service: CrewService,
    ) -> None:
        self.redis_service = redis_service
        self.crew_service = crew_service

    def get_session(self, session_id: int) -> Session:
        return Session.objects.get(id=session_id)

    def stop_session(self, session_id: int) -> None:
        session: Session = self.get_session(session_id=session_id)
        # TODO: Send notify to redis channel to stop container

        session.status = Session.SessionStatus.END
        session.save()

    def get_session_status(self, session_id: int) -> Session.SessionStatus:
        session: Session = self.get_session(session_id=session_id)
        return session.status

    def create_session(self, crew_id: int) -> int:
        session = Session.objects.create(
            crew_id=crew_id, status=Session.SessionStatus.RUN
        )
        return session.pk

    def create_session_schema_json(self, session_id: int) -> str:

        session = self.get_session(session_id=session_id)

        serialized_session = NestedSessionSerializer(session).data

        serialized_crew = serialized_session["crew"]
        serialized_session["crew"] = self.crew_service.inject_tasks(serialized_crew)

        return json.dumps(serialized_session)

    def run_session(self, session_id: int) -> None:
        session_schema_json = self.create_session_schema_json(session_id=session_id)

        # CheckStatus
        self.redis_service.set_session_data(
            session_id=session_id,
            session_json_schema=session_schema_json,
        )
        self.redis_service.publish_start_session(session_id=session_id)
