import os
import json
import redis

class RedisService():
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))

    redis_client = redis.Redis(host=redis_host, port=redis_port)

    @classmethod
    def loadToolAliases(cls) -> str:
        keys = [key.decode('utf-8') for key in cls.redis_client.hkeys("tools")]
        return json.dumps(keys)
    

    @classmethod
    def putCrewSchemaOnRedis(cls, crew_id, crew_schema):
        cls.redis_client.hset("crews:schema", crew_id, json.dumps(crew_schema))
        cls.redis_client.publish("run_crew_updates", crew_id)
