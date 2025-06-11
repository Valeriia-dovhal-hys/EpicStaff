import json
import os

import redis
from django.db import transaction

from tables.models import Session, SessionMessage
from loguru import logger

class RedisPubSub:

    def __init__(
        self,
        crewai_output_channel_name="sessions:crewai_output",
        session_status_channel_name="sessions:session_status",
    ):
        self.crewai_output_channel_name = crewai_output_channel_name
        self.session_status_channel_name = session_status_channel_name
        
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))

        self.redis_client = redis.Redis(host=redis_host, port=redis_port)
        self.pubsub = self.redis_client.pubsub()

        logger.debug(f"redis_host={redis_host}")
        logger.debug(f"redis_port={redis_port}")

    def crewai_output_handler(self, redis_message: dict):
        logger.info(f"Got message from crewai_output_handler: {redis_message}" )
        message = json.loads(redis_message["data"])
        session = Session.objects.get(id=message["session_id"])

        with transaction.atomic():
            session_message = SessionMessage(
                session=session,
                message_from=SessionMessage.MessageFrom.CREW,
                text=message["text"],
                # created_at = message.get("timestamp") # TODO fix this
            )
            session_message.save()

    def session_status_handler(self, redis_message: dict):
        logger.info(f"Got message from session_status_handler: {redis_message}" )
        message = json.loads(redis_message["data"])
        session_id = message["session_id"]
        new_status = message["status"]

        with transaction.atomic():
            session = Session.objects.get(id=session_id)
            session.status = new_status
            session.save()

    def listen_for_messages(self, *args, **kwargs):
        self.pubsub.subscribe(
            **{
                self.crewai_output_channel_name: self.crewai_output_handler,
                self.session_status_channel_name: self.session_status_handler,
            }
        )
        daemon = kwargs.get("daemon", False)
        self.pubsub.run_in_thread(0.001, daemon=daemon)
