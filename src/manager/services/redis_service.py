import os
import json
import redis.asyncio as aioredis

from helpers.logger import logger
from models.models import SessionStatus


class RedisService:

    def __init__(
            self,
            session_start_channel="sessions:start"
    ):
        self.redis_client = None
        self.session_start_channel=session_start_channel


    async def init_redis(self):
        host = os.environ.get("REDIS_HOST", "localhost")
        port = os.environ.get("REDIS_PORT", 6379)
        self.redis_client = await aioredis.from_url(f'redis://{host}:{port}')
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe(self.session_start_channel)


    async def listen_redis(self):
        logger.info("Starting Redis listener...")

        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                channel = message['channel'].decode("utf-8")
                data = message['data'].decode('utf-8')

    async def _publish(self, channel: str, message):
        full_channel = f"sessions:{channel}"
        
        try:
            await self.redis_client.publish(
                full_channel,
                json.dumps(message),
            )
            logger.info(f"Message successfully published on channel '{full_channel}'")
        except Exception as e:
            logger.error(f"Error occurred while publishing message on channel '{full_channel}': {str(e)}")
            raise
