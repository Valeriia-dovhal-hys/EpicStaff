import os
import json
from typing import Callable
import redis


# TODO: singleton maybe?
class RedisService:

    def __init__(self):

        redis_host = os.getenv("REDIS_HOST", "redis")
        redis_port = int(os.getenv("REDIS_PORT", 6379))

        self.redis_client = redis.Redis(host=redis_host, port=redis_port)
        self.pubsub = self.redis_client.pubsub()

        self._pubsub_thread = self.pubsub.run_in_thread(sleep_time=0.1)

    def loadToolAliases(self) -> str:
        keys = [key.decode("utf-8") for key in self.redis_client.hkeys("tools")]
        return json.dumps(keys)

    def set_crew_data(self, crew_id: int, crew_json_schema: str) -> None:
        self.redis_client.set(f"crews:{crew_id}:schema", crew_json_schema)

    def publish_start_crew(self, crew_id: int) -> None:
        self.redis_client.publish("crews:start", crew_id)

    def subscribe_with_handler(self, channel: str, handler: Callable) -> None:
        self.pubsub.subscribe(**{channel: handler})

    def unsubscribe(self, channel: str) -> None:
        self.pubsub.unsubscribe(channel)
