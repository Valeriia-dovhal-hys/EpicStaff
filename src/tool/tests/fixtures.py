from typing import Optional, Type
import pytest
from unittest import mock
from langchain_core.tools import BaseTool, tool
from pydantic import BaseModel, Field

from langchain_core.callbacks import CallbackManagerForToolRun


@pytest.fixture
def test_tool_with_args_schema() -> BaseTool:
    class TestToolInput(BaseModel):
        """Input for the Test tool."""

        string_test_field: str = Field(description="some string to test")
        integer_test_field: int = Field(description="some integer to test")

    class TestTool(BaseTool):
        """Tool for testing"""

        name: str = "Test tool"
        description: str = "It is a test tool to check if system works correctly"

        args_schema: Type[BaseModel] = TestToolInput

        def _run(
            self,
            string_test_field: str,
            integer_test_field: int,
            run_manager: Optional[CallbackManagerForToolRun] = None,
        ) -> str:
            """Concatinate string and int fields"""
            return f"{string_test_field}{integer_test_field}"

    return TestTool()


@pytest.fixture
def test_tool_without_args_schema() -> BaseTool:
    
    class TestTool(BaseTool):
        """Tool for testing"""

        name: str = "Test tool"
        description: str = "It is a test tool to check if system works correctly"

        def _run(
            self,
            string_test_field: str,
            integer_test_field: int,
            run_manager: Optional[CallbackManagerForToolRun] = None,
        ) -> str:
            """Concatinate string and int fields"""
            return f"{string_test_field}{integer_test_field}"

    return TestTool()
