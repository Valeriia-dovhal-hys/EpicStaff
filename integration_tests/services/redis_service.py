import asyncio
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
        """Establish connection with Redis."""
        self.aioredis_client = await aioredis.from_url(
            f"redis://{self.host}:{self.port}", decode_responses=True
        )
        logger.info("Connected to Redis.")

    async def async_subscribe(self, channel: str) -> PubSub:
        """Subscribe to a Redis channel."""
        pubsub = self.aioredis_client.pubsub()
        await pubsub.subscribe(channel)
        return pubsub

    async def async_publish(self, channel: str, message: object):
        """Publish a message to a Redis channel."""
        await self.aioredis_client.publish(channel, json.dumps(message))
        logger.info(f"Message published to channel '{channel}': {message}")

    async def listen_to_channel(self, channel: str, callback):
        """Listen for messages on a Redis channel."""
        pubsub = await self.async_subscribe(channel)
        logger.info(f"Subscribed to Redis channel: {channel}")

        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                logger.info(f"Received message from Redis: {data}")
                await callback(data)
