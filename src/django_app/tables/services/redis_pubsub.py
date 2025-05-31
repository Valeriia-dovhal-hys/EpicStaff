import json
import os

import redis

from tables.models import Session, SessionMessage


class RedisPubSub:

    def __init__(self, message_channel_name="sessions:messages"):
        self.message_channel_name = message_channel_name
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))

        self.redis_client = redis.Redis(host=redis_host, port=redis_port)
        self.pubsub = self.redis_client.pubsub()

    def handler(self, redis_message: dict):
        message = json.loads(redis_message["data"])

        session = Session.objects.get(id=message["session_id"])

        session_message = SessionMessage(
            session=session,
            message_from=SessionMessage.MessageFrom.CREW,
            text=message["text"],
            # created_at = message.get("timestamp") # TODO fix this
        )
        session_message.save()

    def listen_for_messages(self):
        self.pubsub.subscribe(**{self.message_channel_name: self.handler})
        self.pubsub.run_in_thread(sleep_time=0.1)
