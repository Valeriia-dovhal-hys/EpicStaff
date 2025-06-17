import asyncio
from loguru import logger
from models.ai_models import RealtimeTool, ToolParameters
from services.redis_service import RedisService
from uuid import uuid4

from .base_tool_executor import BaseToolExecutor
from models.request_models import KnowledgeSearchMessage

import json


class KnowledgeSearchToolExecutor(BaseToolExecutor):
    def __init__(
        self,
        knowledge_collection_id: int,
        redis_service: RedisService,
        knowledge_search_get_channel: str,
        knowledge_search_response_channel: str,
        search_limit: int,
        distance_threshold: float,
    ):
        super().__init__(tool_name="knowledge_tool")
        self.knowledge_search_get_channel = knowledge_search_get_channel
        self.knowledge_collection_id = knowledge_collection_id
        self.distance_threshold = distance_threshold
        self.search_limit = search_limit
        self.knowledge_search_response_channel = knowledge_search_response_channel
        self.redis_service = redis_service
        self._realtime_model = self._gen_knowledge_realtime_tool_model()

    async def execute(self, **kwargs) -> list[str]:
        query = kwargs.get("query")
        if query is None:
            return
        # TODO: wait for redis search
        pubsub = await self.redis_service.async_subscribe(
            channel=self.knowledge_search_response_channel
        )
        execution_uuid = str(uuid4())
        execution_message = KnowledgeSearchMessage(
            collection_id=self.knowledge_collection_id,
            uuid=execution_uuid,
            query=query,
            search_limit=self.search_limit,
            distance_threshold=self.distance_threshold,
        )
        await self.redis_service.async_publish(
            channel=self.knowledge_search_get_channel,
            message=execution_message.model_dump(),
        )
        logger.info("Waiting for memory")
        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=0.1
            )
            if not message:
                continue
            data = json.loads(message["data"])

            if data["uuid"] == execution_uuid:

                knowledges = "\n\n".join(data["results"])
                result = (
                    f"\nUse this information for answer: {knowledges}"
                    if knowledges
                    else ""
                )
                return result

            await asyncio.sleep(0.1)

    def _gen_knowledge_realtime_tool_model(self) -> RealtimeTool:
        tool_parameters = ToolParameters(
            properties={
                "query": {"type": "string", "description": "Search query in document"}
            },
            required=["query"],
        )
        return RealtimeTool(
            name=self.tool_name,
            description="Use this tool every time user asks anything",
            parameters=tool_parameters,
        )

    async def get_realtime_tool_model(self) -> RealtimeTool:
        return self._realtime_model
