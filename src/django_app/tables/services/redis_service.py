import os
import json
import redis


# TODO: singleton maybe?
class RedisService:

    def __init__(self):

        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))

        self.redis_client = redis.Redis(host=redis_host, port=redis_port)
        self.pubsub = self.redis_client.pubsub()

    def loadToolAliases(self) -> str:
        keys = [key.decode("utf-8") for key in self.redis_client.hkeys("tools")]
        return json.dumps(keys)

    def set_crew_data(self, crew_id: int, crew_json_schema: str) -> None:
        self.redis_client.set(f"crews:{crew_id}:schema", crew_json_schema)

    def publish_start_crew(self, crew_id: int) -> None:
        self.redis_client.publish("crews:start", crew_id)
