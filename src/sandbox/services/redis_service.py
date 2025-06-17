import json
import redis.asyncio as aioredis
from loguru import logger
from redis.client import PubSub


class RedisService:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port

        self.aioredis_client: aioredis.Redis | None = None

    async def connect(self):
        self.aioredis_client = await aioredis.from_url(
            f"redis://{self.host}:{self.port}", decode_responses=True
        )
    async def async_subscribe(self, channel: str) -> PubSub:
        pubsub = self.aioredis_client.pubsub()
        await pubsub.subscribe(channel)
        return pubsub

    async def async_publish(self, channel: str, message: object):
        await self.aioredis_client.publish(channel, json.dumps(message))
        logger.info(f"Message published to channel '{channel}'.")
