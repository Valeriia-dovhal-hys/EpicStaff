import os
import sys
import tempfile
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



@pytest.fixture
def create_temporary_package_structure():
    
    """
    Set up a temporary package structure on the filesystem.
    """
    test_dir = tempfile.TemporaryDirectory()
    package_dir = os.path.join(test_dir.name, "test_package")
    os.makedirs(package_dir)

    with open(os.path.join(package_dir, "__init__.py"), "w") as f:
        f.write("# test package init file")

    module_path = os.path.join(package_dir, "test_module.py")
    with open(module_path, "w") as f:
        f.write("""
class TestClass:
    pass
""")
    sys.path.insert(0, test_dir.name)
    yield "test_package"
    sys.path.pop(0)
    sys.modules.pop("test_package", None)
    sys.modules.pop("test_package.test_module", None)
    test_dir.cleanup()
    