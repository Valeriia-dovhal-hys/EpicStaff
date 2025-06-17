import os
import json
import redis.asyncio as aioredis
from redis.client import PubSub

from helpers.logger import logger


class RedisService:

    def __init__(self, session_start_channel="sessions:start"):
        self.aioredis_client = None
        self.session_start_channel = session_start_channel

    async def init_redis(self):
        host = os.environ.get("REDIS_HOST", "localhost")
        port = os.environ.get("REDIS_PORT", 6379)
        self.aioredis_client = await aioredis.from_url(f"redis://{host}:{port}")
        self.pubsub = self.aioredis_client.pubsub()
        await self.pubsub.subscribe(self.session_start_channel)

    async def listen_redis(self):
        logger.info("Starting Redis listener...")

        async for message in self.pubsub.listen():
            if message["type"] == "message":
                channel = message["channel"].decode("utf-8")
                data = message["data"].decode("utf-8")

    async def _publish(self, channel: str, message):
        full_channel = f"sessions:{channel}"

        try:
            await self.aioredis_client.publish(
                full_channel,
                json.dumps(message),
            )
            logger.info(f"Message successfully published on channel '{full_channel}'")
        except Exception as e:
            logger.error(
                f"Error occurred while publishing message on channel '{full_channel}': {str(e)}"
            )
            raise

    async def async_subscribe(self, channel: str) -> PubSub:
        pubsub = self.aioredis_client.pubsub()
        await pubsub.subscribe(channel)
        return pubsub

    async def async_publish(self, channel: str, message: object):
        await self.aioredis_client.publish(channel, json.dumps(message))
        logger.info(f"Message published to channel '{channel}'.")
