from abc import ABC
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel, Field, PrivateAttr

from redis import Redis
import json
import os


class Logger(BaseModel):
    verbose: bool
    redis_host: str
    redis_port: int

    def __init__(
        self,
        verbose: bool = True,
        redis_host: str | None = None,
        redis_port: int = 6379,
        **data,
    ):
        super().__init__(**data)
        
        self.verbose = verbose
        self.redis_host = (
            redis_host
            if redis_host is not None
            else os.environ("PROCESS_REDIS_HOST", "redis")
        )
        self.redis_port = redis_port 
        

    def get_crew_id(self) -> int:
        return int(os.environ.get("CREW_ID", 0))

    def get_crew_data(self, redis_client: Redis, crew_id: int) -> dict:
        redis_data = redis_client.get(crew_id)

        if redis_data is None:
            return dict()

        return json.loads(redis_data)

    def add_message(
        self, redis_client: Redis, crew_id: int, crew_message: dict
    ) -> None:
        crew_data = self.get_crew_data(redis_client=redis_client, crew_id=crew_id)
        msg_list: list = crew_data.get("messages", [])
        msg_list.append(crew_message)
        crew_data["messages"] = msg_list
        redis_client.set(crew_id, json.dumps(crew_data))

    def log(self, level: str, message: str) -> None:
        redis_client = Redis(
            host=self.redis_host, port=self.redis_port, decode_responses=True
        )
        crew_id = self.get_crew_id()
        msg = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "level": level,
            "text": message,
        }

        self.add_message(redis_client=redis_client, crew_id=crew_id, crew_message=msg)


class FileLogger:
    def __init__(self, filepath: Path, verbose_level=0):
        self._filepath = filepath
        self.verbose_level = verbose_level

    def log(self, level, message):
        level_map = {"debug": 1, "info": 2}
        if self.verbose_level and level_map.get(level, 0) <= self.verbose_level:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            text = f"[{timestamp}][{level.upper()}]: {message}"

            with open(self._filepath, "a") as f:
                f.write(text + "\n")
