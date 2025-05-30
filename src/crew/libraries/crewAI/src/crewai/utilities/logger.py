from abc import ABC
from datetime import datetime
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field, PrivateAttr, model_validator

from redis import Redis
import json
import os


class Logger(BaseModel):
    verbose: bool = Field(default=True, allow_mutation=False)
    redis_host: str | int = Field(
        default=os.environ.get("PROCESS_REDIS_HOST", "redis"), allow_mutation=False
    )
    redis_port: int = Field(default=6379, allow_mutation=False)
    session_id: int = Field(default=os.environ.get("SESSION_ID", 0), allow_mutation=False)
    _redis_client: Redis = PrivateAttr()

    @model_validator(mode="after")
    def set_private_attrs(self) -> "Logger":
        self._redis_client = Redis(
            host=self.redis_host, port=self.redis_port, decode_responses=True
        )
        return self

    def log(self, level: str, message: str) -> None:

        msg = {
            "session_id": self.session_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "level": level,
            "text": message,
        }
        self._redis_client.publish(channel=f"sessions:crewai_output", message=json.dumps(msg))


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
