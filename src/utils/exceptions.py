class ToolLoadException(Exception):
    pass


class ToolNotFoundException(ToolLoadException):
    def __init__(self, tool_name) -> None:
        super().__init__(
            f"No class or function found for tool '{tool_name}'. Tool not created."
        )


class ToolCallableFoundException(ToolLoadException):
    def __init__(self, base_name, tool_name) -> None:
        super().__init__(
            f"No callable found for '{base_name}'. Tool '{tool_name}' not created."
        )


class ToolRegisterException(ToolLoadException):
    def __init__(self, callable_item, e) -> None:
        super().__init__(f"Failed to register {callable_item}: {str(e)}")
