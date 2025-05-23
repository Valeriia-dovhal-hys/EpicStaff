import json
import os
from threading import Thread
from typing import Callable, Protocol

from redis import Redis


class MessageHandler(Protocol):
    def __call__(self, message: dict) -> None: ...


class RedisService:

    def __init__(self, crew_id: int, redis_host=None):
        if redis_host is None:
            redis_host = os.environ.get("PROCESS_REDIS_HOST", "redis")
        self.redis_host = redis_host
        self.redis_client = Redis(redis_host=redis_host, decode_responses=True)
        self.crew_id = crew_id

    def publish(self, channel: str, message: str):
        channel_name = f"{self.crew_id}:{channel}"
        self.redis_client.publish(channel=channel_name, message=json.dumps(message))

    def get_json_crew_schema(self, crew_id: int) -> str | None:
        return self.redis_client.get(f"{crew_id}:schema")
