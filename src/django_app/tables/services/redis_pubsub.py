import json
import os
import redis
from django.db import transaction
from tables.models import GraphSessionMessage
from tables.models import PythonCodeResult
from tables.request_models import CodeResultData, GraphSessionMessageData
from tables.services.session_manager_service import SessionManagerService
from tables.models import Session
from loguru import logger


class RedisPubSub:
    def __init__(
        self,
        session_status_channel_name="sessions:session_status",
        code_results_channel_name="code_results",
        graph_messages_channel_name="graph:messages",
    ):
        self.session_status_channel_name = session_status_channel_name
        self.code_results_channel_name = code_results_channel_name
        self.graph_messages_channel_name = graph_messages_channel_name
        redis_host = os.getenv("REDIS_HOST", "127.0.0.1")
        redis_port = int(os.getenv("REDIS_PORT", 6379))

        self.redis_client = redis.Redis(
            host=redis_host, port=redis_port, decode_responses=True
        )
        self.pubsub = self.redis_client.pubsub()

        self.handlers = {
            self.session_status_channel_name: self.session_status_handler,
            self.code_results_channel_name: self.code_results_handler,
            self.graph_messages_channel_name: self.graph_session_message_handler,
        }

        self.subscribe_to_channels()

        logger.debug(f"Redis host: {redis_host}")
        logger.debug(f"Redis port: {redis_port}")

    def subscribe_to_channels(self):
        self.pubsub.subscribe(**self.handlers)

    def session_status_handler(self, message: dict):
        try:
            logger.info(f"Received message from session_status_handler: {message}")
            data = json.loads(message["data"])
            with transaction.atomic():
                session = Session.objects.get(id=data["session_id"])
                if data[
                    "status"
                ] == Session.SessionStatus.EXPIRED and session.status in [
                    Session.SessionStatus.END,
                    Session.SessionStatus.ERROR,
                ]:
                    logger.info(
                        f'Unable change status from {session.status} to {data["status"]}'
                    )
                else:
                    session.status = data["status"]
                    session.status_data = data.get("status_data", {})
                    session.save()
        except Exception as e:
            logger.error(f"Error handling session_status message: {e}")

    def code_results_handler(self, message: dict):
        try:
            logger.info(f"Received message from code_result_handler: {message}")
            data = json.loads(message["data"])
            CodeResultData.model_validate(data)
            PythonCodeResult.objects.create(**data)
        except Exception as e:
            logger.error(f"Error handling code_results message: {e}")

    def graph_session_message_handler(self, message: dict):
        try:
            logger.info(f"Received message from graph_message_handler: {message}")
            data = json.loads(message["data"])
            graph_session_message_data = GraphSessionMessageData.model_validate(data)
            GraphSessionMessage.objects.create(
                session_id=graph_session_message_data.session_id,
                created_at=graph_session_message_data.timestamp,
                name=graph_session_message_data.name,
                execution_order=graph_session_message_data.execution_order,
                message_data=graph_session_message_data.message_data,
            )

        except Exception as e:
            logger.error(f"Error handling graph_session_message: {e}")

    def listen_for_messages(self):
        logger.info("Listening for Redis messages...")
        while True:
            try:
                message = self.pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=0.001
                )
                if message:
                    channel = message.get("channel", "")
                    handler = self.handlers.get(channel)

                    if handler:
                        handler(message)
                    else:
                        logger.warning(f"No handler found for channel: {channel}")
            except Exception as e:
                logger.error(f"Error while listening for Redis messages: {e}")
