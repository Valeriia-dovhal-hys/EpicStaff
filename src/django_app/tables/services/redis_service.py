import os
import json
import redis
from threading import Lock

from utils.singleton_meta import SingletonMeta
from utils.logger import logger


class RedisService(metaclass=SingletonMeta):
    _lock: Lock = Lock()

    def __init__(self):

        self._redis_client = None
        self._pubsub = None
        self._redis_host = os.getenv("REDIS_HOST", "localhost")
        self._redis_port = int(os.getenv("REDIS_PORT", 6379))

    def _initialize_redis(self):
        with self._lock:
            if self._redis_client is None:
                self._redis_client = redis.Redis(
                    host=self._redis_host, port=self._redis_port
                )
                self._pubsub = self._redis_client.pubsub()

    @property
    def redis_client(self):
        """Lazy initialize redis_client"""
        if self._redis_client is None:
            self._initialize_redis()
        return self._redis_client

    @property
    def pubsub(self):
        """Lazy initialize pubsub"""
        if self._pubsub is None:
            self._initialize_redis()
        return self._pubsub

    def set_session_data(self, session_id: int, session_json_schema: str) -> None:
        self.redis_client.set(f"sessions:{session_id}:schema", session_json_schema)
        logger.info(f"Session data set in Redis for session ID: {session_id}.")

    def publish_start_session(self, session_id: int) -> None:
        self.redis_client.publish("sessions:start", session_id)
        logger.info(f"Start session event published to Redis for session ID: {session_id}.")
