import os
import json
import redis.asyncio as aioredis

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
        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                channel = message['channel'].decode("utf-8")
                data = message['data'].decode('utf-8')

                # TODO: add to logger
                print(f"Got update for session_id: {data}")

                if channel == self.session_start_channel:
                    try:
                        await self.session_start_handler(int(data))
                    except ValueError as e:
                        print(e)


    async def session_start_handler(self, session_id: int):
        try:
            self.crew_container_service.request_run_crew(session_id)
        except Exception as e:
            print(e)
            await self.publish_session_status(session_id, SessionStatus.ERROR)


    async def _publish(self, channel: str, message):
        self.redis_client.publish(
            f"sessions:{channel}",
            json.dumps(message),
        )


    async def publish_session_status(self, session_id: int, session_status: SessionStatus):
        message = {
            'session_id': session_id,
            'status': session_status.value,
        }
        await self._publish("session_status", message)
