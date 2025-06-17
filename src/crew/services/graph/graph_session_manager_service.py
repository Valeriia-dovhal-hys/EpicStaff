import json
from typing import Any
from models.dotdict import DotDict
from services.graph.graph_builder import SessionGraphBuilder, State
from services.python_code_executor_service import RunPythonCodeService
from utils.singleton_meta import SingletonMeta
from services.crew.crew_parser_service import CrewParserService
from services.redis_service import RedisService
from models.request_models import GraphSessionMessageData, SessionData
from loguru import logger
import asyncio
from pathlib import Path
from utils.helpers import load_env
from services.graph.graph_builder import SessionGraphBuilder
from services.knowledge_search_service import KnowledgeSearchService
from dataclasses import asdict


class GraphSessionManagerService(metaclass=SingletonMeta):
    def __init__(
        self,
        redis_service: RedisService,
        crew_parser_service: CrewParserService,
        python_code_executor_service: RunPythonCodeService,
        session_schema_channel: str,
        crewai_output_channel: str,
        knowledge_search_service: KnowledgeSearchService,
    ):
        """
        Initializes the GraphSessionManagerService with the required services and configuration.

        Args:
            redis_service (RedisService): The service responsible for Redis operations.
            crew_parser_service (CrewParserService): The service responsible for parsing crew data.
            python_code_executor_service (RunPythonCodeService): The service responsible for executing Python code.
            session_schema_channel (str): The Redis channel for listening to session schema messages.
            crewai_output_channel (str): The Redis channel for publishing CrewAI output messages.
        """

        self.session_graph_pool: dict[int, asyncio.Task] = {}
        self.redis_service = redis_service
        self.crew_parser_service = crew_parser_service
        self.python_code_executor_service = python_code_executor_service
        self.session_schema_channel = session_schema_channel
        self.crewai_output_channel = crewai_output_channel
        self.knowledge_search_service = knowledge_search_service

    def start(self):
        self._listener_task = asyncio.create_task(self._listen_to_channel())
        logger.info("Session Manager Service is now running.")

    async def run_session(self, session_data: SessionData):
        
        try:
            session_id = session_data.id
            initial_state = session_data.initial_state

            session_graph_builder = SessionGraphBuilder(
                session_id=session_id,
                redis_service=self.redis_service,
                crew_parser_service=self.crew_parser_service,
                python_code_executor_service=self.python_code_executor_service,
                crewai_output_channel=self.crewai_output_channel,
                knowledge_search_service=self.knowledge_search_service,
            )

            graph = session_graph_builder.compile_from_schema(session_data=session_data)

            state = {
                "state_history": [],
                "variables": DotDict(initial_state),
            }

            await self.redis_service.async_update_session_status(
                session_id=session_id, status="run"
            )
            async for stream_mode, chunk in graph.astream(
                state, stream_mode=["values", "custom"]
            ):
                if stream_mode == "custom":
                    data = asdict(chunk)
                    assert isinstance(data, dict), "custom chunk must be a dict"

                    await self.redis_service.async_publish("graph:messages", data)
                logger.debug(f"Mode: {stream_mode}. Chunk: {chunk}")

            await self.redis_service.async_update_session_status(
                session_id=session_id, status="end"
            )

        except Exception as e:
            logger.exception(f"Failed to start session: {e}")
            await self.redis_service.async_update_session_status(session_id=session_id, status="error", error=e)

    async def stop_session(self, session_id: int):
        task = self.session_graph_pool.get(session_id)
        if task:
            task.cancel()
            logger.info(f"Session {session_id} stopped.")
        else:
            logger.warning(f"Session {session_id} not found.")



    async def _listen_to_channel(
        self,
    ):
        schema_pubsub = await self.redis_service.async_subscribe(self.session_schema_channel)
        try:
            async for message in schema_pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"]
                    data = message["data"]

                    # Update env keys first
                    config_path = Path("env_config/config.yaml").resolve().as_posix()
                    load_env(config_path)

                    await self._handle_message(channel, data)

        except Exception as e:  # asyncio.CancelledError
            ...
            logger.exception("PubSub listener task cancelled.")
        finally:
            await schema_pubsub.unsubscribe(self.session_schema_channel)

    async def _handle_message(self, channel: str, data: str):
        logger.info(f"Received message from channel {channel}: {data}")

        session_schema = json.loads(data)
        if channel == self.session_schema_channel:

            session_data = SessionData.model_validate(session_schema)

            self.session_graph_pool[session_data.id] = asyncio.create_task(self.run_session(session_data))
