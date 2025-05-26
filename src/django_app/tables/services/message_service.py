import json
from typing import Callable
from tables.models import Session, SessionMessage
from tables.services.redis_service import RedisService


class MessageService:

    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service

    def _crew_message_handler_factory(self, session) -> Callable:

        def handler(redis_message: dict):
            message = json.loads(redis_message["data"])

            session_message = SessionMessage(
                session=session,
                message_from=SessionMessage.MessageFrom.CREW,
                text=message["text"],
                # created_at = message.get("timestamp") # TODO fix this
            )
            session_message.save()

        return handler

    def subscribe_for_messages(self, session: Session):
        self.redis_service.subscribe_with_handler(
            f"crews:{session.crew.pk}:messages",
            self._crew_message_handler_factory(session),
        )

    def unsubscribe_for_messages(self, session: Session):
        self.redis_service.unsubscribe(f"crews:{session.crew.pk}:messages")
