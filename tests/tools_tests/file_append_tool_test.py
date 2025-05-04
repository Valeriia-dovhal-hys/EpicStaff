from crewai import Task
from pathlib import Path

import pytest
import pytest_mock
from pytest_mock import mocker, MockerFixture
from unittest.mock import patch, call, Mock

from src.tools import AppendFileTool
from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import append_file_tool
from tests.conftest import test_dir


class TestFileAppendTool:

    def test_append_tool(self, append_file_tool: AppendFileTool):
        """Test file append tool"""

        text_lines = ["Line 1", "Line 2\n", "\n\n\n\tLine 3 blablabla", ""]
        file_name = "text_file.txt"
        file_path = Path(test_dir) / file_name
        tool = append_file_tool

        text = ""
        for line in text_lines:
            result = tool._run(file_path=file_path, append_text=line)
            assert result == "Text appended successfully."
            text += line + "\n"

            with open(file_path) as f:
                assert f.read() == text

    def test_run_without_append_text_type_error(
        self, mocker: MockerFixture, append_file_tool: AppendFileTool
    ):
        """Test running file append tool with no append text"""
        tool = append_file_tool
        mocker.patch("builtins.open", mock_empty_file())
        with pytest.raises(TypeError) as exc_info:
            None + "str"  # This will raise a TypeError

        result = tool._run()

        assert result == f"Failed to append text: {exc_info.value}"

    @pytest.mark.skip
    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_append_tool_with_crewai(self, agent, append_file_tool):
        file_path = Path(test_dir) / "dummy.txt"

        initial_text = "Dummy initial text\n"
        file_path.write_text(initial_text)
        abs_path = file_path.resolve()
        text_to_append = "Append me"

        agent.tools.append(append_file_tool)
        task = Task(
            description=f"""Append the text {text_to_append} to {abs_path}""",
            agent=agent,
            expected_output=f"""The response in the 
            following format using relative path:
            "I appended a text {text_to_append} to {file_path}." (without "")
            if file is succesfully created, "Error." if not""",
        )

        output = agent.execute_task(task)

        with open(file_path) as f:
            assert f.read() == initial_text + text_to_append + "\n"

        assert output == f"I appended a text {text_to_append} to {file_path}."
