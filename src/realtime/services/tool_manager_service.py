from models.ai_models import RealtimeTool
from models.request_models import RealtimeAgentChatData
from tool_executors.stop_agent_tool_executor import StopAgentToolExecutor
from services.python_code_executor_service import PythonCodeExecutorService
from services.redis_service import RedisService
from utils.singleton_meta import SingletonMeta
from tool_executors import (
    ConfiguredToolExecutor,
    PythonCodeToolExecutor,
    KnowledgeSearchToolExecutor,
    BaseToolExecutor,
)


class ToolManagerService(metaclass=SingletonMeta):

    def __init__(
        self,
        redis_service: RedisService,
        python_code_executor_service: PythonCodeExecutorService,
        knowledge_search_get_channel: str,
        knowledge_search_response_channel: str,
        manager_host: str,
        manager_port: int,
    ):
        self.knowledge_search_get_channel = knowledge_search_get_channel
        self.knowledge_search_response_channel = knowledge_search_response_channel
        self.manager_host = manager_host
        self.manager_port = manager_port
        self.redis_service = redis_service
        self.python_code_executor_service = python_code_executor_service
        self.connection_tool_executors: dict[str, list[BaseToolExecutor]] = {}

    def register_tools_from_rt_agent_chat_data(
        self,
        realtime_agent_chat_data: RealtimeAgentChatData,
        chat_executor=None,
    ) -> None:
        connection_key = realtime_agent_chat_data.connection_key
        self.connection_tool_executors[connection_key] = []

        if chat_executor is not None:

            stop_agent_tool_executor = StopAgentToolExecutor(
                stop_prompt=realtime_agent_chat_data.stop_prompt,
                chat_executor=chat_executor,
            )
            self.connection_tool_executors[connection_key].append(
                stop_agent_tool_executor
            )

        if realtime_agent_chat_data.knowledge_collection_id is not None:
            knowledge_tool_executor = KnowledgeSearchToolExecutor(
                knowledge_collection_id=realtime_agent_chat_data.knowledge_collection_id,
                distance_threshold=realtime_agent_chat_data.distance_threshold,
                search_limit=realtime_agent_chat_data.search_limit,
                redis_service=self.redis_service,
                knowledge_search_get_channel=self.knowledge_search_get_channel,
                knowledge_search_response_channel=self.knowledge_search_response_channel,
            )
            self.connection_tool_executors[connection_key].append(
                knowledge_tool_executor
            )

        for configured_tool_data in realtime_agent_chat_data.tools:
            configured_tool_executor = ConfiguredToolExecutor(
                configured_tool_data=configured_tool_data,
                host=self.manager_host,
                port=self.manager_port,
            )
            self.connection_tool_executors[connection_key].append(
                configured_tool_executor
            )
        for python_code_tool_data in realtime_agent_chat_data.python_code_tools:
            python_code_tool_executor = PythonCodeToolExecutor(
                python_code_tool_data=python_code_tool_data,
                python_code_executor_service=self.python_code_executor_service,
            )
            self.connection_tool_executors[connection_key].append(
                python_code_tool_executor
            )

    async def get_realtime_tool_models(self, connection_key: str) -> list[RealtimeTool]:
        realtime_tool_models: list[RealtimeTool] = []
        for executor in self.connection_tool_executors[connection_key]:
            rt_tool_model = await executor.get_realtime_tool_model()
            realtime_tool_models.append(rt_tool_model)

        return realtime_tool_models

    async def execute(self, connection_key: str, tool_name: str, call_arguments: dict):
        # TODO: BAD SEARCH. O(n), use dict for O(1)
        for executor in self.connection_tool_executors[connection_key]:
            if executor.tool_name == tool_name:
                return await executor.execute(**call_arguments)

        return f"{tool_name} not found"
