from tables.services.message_service import MessageService
from tables.services.crew_service import CrewService
from tables.services.redis_service import RedisService
from tables.models import Session


class SessionManagerService:

    def __init__(
        self,
        redis_service: RedisService,
        crew_service: CrewService,
        message_service: MessageService,
    ) -> None:
        self.message_service = message_service
        self.redis_service = redis_service
        self.crew_service = crew_service

    def get_session(self, session_id: int) -> Session:
        return Session.objects.get(id=session_id)

    def stop_session(self, session_id: int) -> None:
        session: Session = self.get_session(session_id=session_id)
        self.message_service.unsubscribe_for_messages(crew_id=session.crew.pk)
        # TODO: Send notify to redis channel to stop container

        session.status = Session.SessionStatus.END
        session.save()

    def get_session_status(self, session_id: int) -> Session.SessionStatus:
        session: Session = self.get_session(session_id=session_id)
        return session.status

    def create_session(self, crew_id: int) -> int:
        session = Session.objects.create(crew_id=crew_id, status=Session.SessionStatus.RUN)
        return session.pk


    def session_run_crew(self, session_id: int) -> None:
        session: Session = self.get_session(session_id=session_id)
        crew_json_schema = self.crew_service.create_crew_schema_json(
            crew_id=session.crew.pk
        )
        # CheckStatus
        self.redis_service.set_crew_data(
            crew_id=session.crew.pk, crew_json_schema=crew_json_schema
        )
        self.redis_service.publish_start_crew(session=session)

        self.message_service.subscribe_for_messages(session=session)
