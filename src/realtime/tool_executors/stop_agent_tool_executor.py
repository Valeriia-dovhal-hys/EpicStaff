from models.ai_models import RealtimeTool, ToolParameters

# from services.chat_executor import ChatExecutor, ChatMode
from .base_tool_executor import BaseToolExecutor
from services.chat_mode import ChatMode


class StopAgentToolExecutor(BaseToolExecutor):

    def __init__(
        self,
        stop_prompt: str,
        chat_executor,  # : ChatExecutor,
    ):
        super().__init__(tool_name="stop_agent_tool")
        self.stop_prompt = stop_prompt
        self.chat_executor = chat_executor
        self._realtime_model = self._gen_knowledge_realtime_tool_model()

    async def execute(self, **kwargs) -> list[str]:
        self.chat_executor.current_chat_mode = ChatMode.LISTEN

    def _gen_knowledge_realtime_tool_model(self) -> RealtimeTool:
        tool_parameters = ToolParameters(
            properties={},
            required=[],
        )
        return RealtimeTool(
            name=self.tool_name,
            description=self.stop_prompt,
            parameters=tool_parameters,
        )

    async def get_realtime_tool_model(self) -> RealtimeTool:
        return self._realtime_model
