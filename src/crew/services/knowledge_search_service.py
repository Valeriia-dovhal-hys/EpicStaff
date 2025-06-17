import os
import json
import time
from uuid import uuid4
from loguru import logger

from utils.singleton_meta import SingletonMeta
from services.redis_service import RedisService
from models.request_models import KnowledgeSearchMessage


knowledge_search_get_channel = os.getenv(
    "KNOWLEDGE_SEARCH_GET_CHANNEL", "knowledge:search:get"
)
knowledge_search_response_channel = os.getenv(
    "KNOWLEDGE_SEARCH_RESPONSE_CHANNEL", "knowledge:search:response"
)


class KnowledgeSearchService(metaclass=SingletonMeta):
    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service

    def search_knowledges(
        self,
        sender: str,
        knowledge_collection_id: int,
        query: str,
        search_limit: int,
        distance_threshold: float,
    ) -> list[str]:
        pubsub = self.redis_service.sync_subscribe(
            channel=knowledge_search_response_channel
        )
        execution_uuid = f"{sender}-{str(uuid4())}"

        execution_message = KnowledgeSearchMessage(
            collection_id=knowledge_collection_id,
            uuid=execution_uuid,
            query=query,
            search_limit=search_limit,
            distance_threshold=distance_threshold,
        )

        self.redis_service.sync_publish(
            channel=knowledge_search_get_channel, message=execution_message.model_dump()
        )

        timeout = 15  # seconds
        start_time = time.monotonic()

        while time.monotonic() - start_time < timeout:
            message = pubsub.get_message()
            if message and message["type"] == "message":
                data: dict = json.loads(message["data"])
                if data.get("uuid") == execution_uuid:
                    logger.info(
                        f"Knowledge searching for collection {data['collection_id']} completed in {round((time.monotonic() - start_time), 2)} sec. Sender: {sender}"
                    )
                    return data["results"]
            time.sleep(0.1)

        logger.error(f"Search failed: No response received within {timeout} seconds")
        return []
