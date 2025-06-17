from typing import Type
from singleton_meta import SingletonMeta
from langchain_core.tools import BaseTool
from loguru import logger
from dataclasses import dataclass


class ToolNotFoundException(Exception):
    def __init__(self, tool_alias: str):
        super().__init__(f"Class with tool alias {tool_alias} is not registered")

@dataclass
class ToolRegistryItem:
    tool_class: Type
    args: tuple
    kwargs: dict


class DynamicToolFactory(metaclass=SingletonMeta):
    _tool_registry: dict[str, ToolRegistryItem] = {}

    def __init__(self): ...

    def register_tool_class(
        self,
        tool_alias: str,
        tool_class: Type,
        default_args: tuple | None = None,
        default_kwargs: dict | None = None,
    ):
        """Registers a tool class with a given alias."""
        if default_args is None:
            default_args = tuple()

        if default_kwargs is None:
            default_kwargs = dict()

        self._tool_registry[tool_alias] = ToolRegistryItem(tool_class=tool_class, args=default_args, kwargs=default_kwargs)
        logger.info(f"Registered {tool_alias}")

    def create(
        self,
        tool_alias: str,
        tool_args: tuple | None = None,
        tool_kwargs: dict | None = None,
    ) -> BaseTool:
        """
        Dynamically creates or retrieves an instance of a registered class.
        """
        if tool_alias not in self._tool_registry.keys():
            logger.error(f"{tool_alias} not in {self._tool_registry.keys()}")
            raise ToolNotFoundException(tool_alias=tool_alias)

        if tool_args is None:
            tool_args = tuple()

        if tool_kwargs is None:
            tool_kwargs = dict()

        item: ToolRegistryItem = self._tool_registry[tool_alias]

        combined_args = item.args + tool_args
        combined_kwargs = {**item.kwargs, **tool_kwargs}

        return item.tool_class(*combined_args, **combined_kwargs)

    def get_tool_class(self, tool_alias: str) -> Type[BaseTool]:
        if tool_alias not in self._tool_registry.keys():
            logger.error(f"{tool_alias} not in {self._tool_registry.keys()}")
            raise ToolNotFoundException(tool_alias=tool_alias)
        
        return self._tool_registry.get(tool_alias).tool_class