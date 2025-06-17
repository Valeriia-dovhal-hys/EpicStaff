from abc import ABC, abstractmethod


class BaseToolExecutor(ABC):
    def __init__(self, tool_name: str):
        self.tool_name = tool_name

    @abstractmethod
    async def execute(self, **kwargs): ...

    @abstractmethod
    async def get_realtime_tool_model(self): ...
