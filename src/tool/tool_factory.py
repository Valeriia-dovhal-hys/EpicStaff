from singleton_meta import SingletonMeta
from langchain_core.tools import BaseTool
from loguru import logger


class ToolNotFoundException(Exception):
    def __init__(self, tool_alias: str):
        super().__init__(f"Class with tool alias {tool_alias} is not registered")


class DynamicToolFactory(metaclass=SingletonMeta):
    _tool_registry: dict[str, tuple[type[BaseTool], tuple, dict]] = {}

    def __init__(self):
        ...

    def register_tool_class(
        self,
        tool_alias: str,
        tool_class: type[BaseTool],
        default_args: tuple | None = None,
        default_kwargs: dict | None = None,
    ):
        """Registers a tool class with a given alias."""
        if default_args is None:
            default_args = tuple()

        if default_kwargs is None:
            default_kwargs = dict()

        self._tool_registry[tool_alias] = (tool_class, default_args, default_kwargs)
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

        class_type, default_args, default_kwargs = self._tool_registry[tool_alias]

        combined_args = default_args + tool_args
        combined_kwargs = {**default_kwargs, **tool_kwargs}

        return class_type(*combined_args, **combined_kwargs)

    def get_tool_class(self, tool_alias: str) -> BaseTool:
        tool_registry_item = self._tool_registry.get(tool_alias, None)
        if tool_registry_item is None:
            raise ToolNotFoundException(tool_alias=tool_alias)

        return tool_registry_item[0]
