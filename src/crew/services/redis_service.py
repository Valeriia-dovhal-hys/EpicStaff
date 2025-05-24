import json
import os
from typing import  Protocol
from services.container_manager_service import ContainerManagerService

from redis import Redis


class MessageHandler(Protocol):
    def __call__(self, message: dict) -> None: ...


class RedisService:

    def __init__(
        self,
        container_manager_service: ContainerManagerService,
        crew_id: int | None = None,
        redis_host: str | None = None,
    ):
        if redis_host is None:
            redis_host = os.environ.get("PROCESS_REDIS_HOST", "redis")
        self.redis_host = redis_host
        self.redis_client = Redis(host=redis_host, decode_responses=True)
        self.container_manager_service = container_manager_service
        self.crew_id = (
            crew_id if crew_id is not None else container_manager_service.get_crew_id()
        )

    def publish(self, channel: str, message: str):
        channel_name = f"{self.crew_id}:{channel}"
        self.redis_client.publish(channel=channel_name, message=json.dumps(message))

    def read(self, channel: str):
        channel_name = f"crews:{self.crew_id}:{channel}"
        return self.redis_client.get(channel_name)

    def get_json_crew_schema(self) -> str | None:
        return self.read("schema")
