import json
import redis.asyncio as aioredis

from services.crew_container_service import CrewContainerService
from models.models import SessionStatus


class RedisService:

    def __init__(self):
        self.redis_client = None
        self.crew_container_service = CrewContainerService()


    async def init_redis(self):
        self.redis_client = await aioredis.from_url('redis://redis:6379')


    async def subscribe_to_start_session(self):
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe("sessions:start")

        async for message in pubsub.listen():
            if message['type'] == 'message':
                session_id = message['data'].decode('utf-8')

                # TODO: add to logger
                print(f"Got update for session_id: {session_id}")
                
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
