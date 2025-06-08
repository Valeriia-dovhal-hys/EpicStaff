import os
import json
import redis.asyncio as aioredis

from helpers.logger import logger
from services.crew_container_service import CrewContainerService
from models.models import SessionStatus


class RedisService:

    def __init__(
            self,
            session_start_channel="sessions:start"
    ):
        self.redis_client = None
        self.crew_container_service = CrewContainerService()
        self.session_start_channel=session_start_channel


    async def init_redis(self):
        host = os.getenv("REDIS_HOST")
        port = os.getenv("REDIS_PORT")
        self.redis_client = await aioredis.from_url(f'redis://{host}:{port}')
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe(self.session_start_channel)



    async def listen_redis(self):
        logger.info("Starting Redis listener...")

        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                channel = message['channel'].decode("utf-8")
                data = message['data'].decode('utf-8')

                logger.info(f"Got update for session_id: {data} on channel: {channel}")

                if channel == self.session_start_channel:
                    try:
                        await self.session_start_handler(int(data))
                    except ValueError as e:
                        logger.error(f"ValueError while processing session_id {data}: {str(e)}")


    async def session_start_handler(self, session_id: int):
        try:
            self.crew_container_service.request_run_crew(session_id)
            logger.info(f"Crew container service successfully started for session_id: {session_id}")
        except Exception as e:
            logger.error(f"Error occurred while starting session for session_id {session_id}: {str(e)}")
            await self.publish_session_status(session_id, SessionStatus.ERROR)


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


    async def publish_session_status(self, session_id: int, session_status: SessionStatus):
        message = {
            'session_id': session_id,
            'status': session_status.value,
        }
        
        logger.info(f"Publishing session status for session_id: {session_id} with status: {session_status.value}...")
        
        await self._publish("session_status", message)
