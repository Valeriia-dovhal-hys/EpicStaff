import json
import os

from redis import Redis


class RedisService:

    def __init__(self, redis_host=None):
        if redis_host is None:
            redis_host = os.environ.get("PROCESS_REDIS_HOST", "redis")
        self.redis_host = redis_host
        self.redis_client = Redis(redis_host=redis_host, decode_responses=True)

    def get_json_crew_schema(self, crew_id: int) -> str | None:
        return self.redis_client.get(crew_id)
    

    def get_crew_output_json(self, crew_id: int):
        redis_client = Redis(decode_responses=True, host=self.redis_host)
        return redis_client.get(name=crew_id)

    def get_crew_output_data(self, crew_id: int) -> dict:
        redis_data = self.redis_client.get(crew_id)

        if redis_data is None:
            return dict()

        return json.loads(redis_data)

    def set_crew_output_data(self, crew_id: int, data: dict) -> None:
        self.redis_client.set(crew_id, json.dumps(data))

    def clear_crew_output_data(self, crew_id: int) -> None:
        self.redis_client.delete(crew_id)
