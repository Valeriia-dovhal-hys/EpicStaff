import json
import os
from typing import Protocol
from services.container_manager_service import ContainerManagerService
from models.response_models import SessionStatus

from redis import Redis


class MessageHandler(Protocol):
    def __call__(self, message: dict) -> None: ...


class RedisService:

    def __init__(
        self,
        container_manager_service: ContainerManagerService,
        session_id: int | None = None,
        redis_host: str | None = None,
    ):
        if redis_host is None:
            redis_host = os.environ.get("PROCESS_REDIS_HOST", "localhost")
            
        self.redis_host = redis_host
        self.redis_client = Redis(host=redis_host, decode_responses=True)
        self.container_manager_service = container_manager_service
        self.session_id = (
            session_id if session_id is not None else container_manager_service.get_session_id()
        )


    def _publish(self, channel: str, message):
        channel_name = f"sessions:{channel}"
        self.redis_client.publish(channel=channel_name, message=json.dumps(message))


    def get_json_session_schema(self) -> str | None:
        channel_name = f"sessions:{self.session_id}:schema"
        return self.redis_client.get(channel_name)


    def publish_session_status(self, session_status: SessionStatus):
        message = {
            'session_id': self.session_id,
            'status': session_status.value,
        }
        self._publish("session_status", message)

    
    def publish_final_result(self, final_result: str):
        self._publish("final_result", final_result)
