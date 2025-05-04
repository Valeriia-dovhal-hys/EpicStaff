from crewai import Task
from pathlib import Path

import pytest
import pytest_mock
from pytest_mock import mocker

from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import create_file_tool, create_file_tool_setup_test_dir
from tests.conftest import test_dir


class TestFileCreateTool:

    @pytest.mark.parametrize(
        "file_passed, file_created",
        [
            (None, "predefined.txt"),
            ("newfile.txt", "newfile.txt"),
        ],
    )
    def test_create_tool(self, mocker, create_file_tool, file_passed, file_created):
        """Test file creation"""

        tool = create_file_tool
        mocked_open = mocker.patch("builtins.open", mock_empty_file())

        result = (
            tool._run(file_path=file_passed) if file_passed is not None else tool._run()
        )
        mocked_open.assert_called_once_with(file_created, "x")
        assert result == "File created successfully"

    def test_create_tool_file_exists(self, mocker, create_file_tool):
        """Test the attempt to create an already existing file"""

        tool = create_file_tool
        mocked_open = mocker.patch("builtins.open", mock_empty_file())

        result = tool._run(file_path="newfile.txt")
        assert result == "File created successfully"
        mocked_open.assert_called_once_with("newfile.txt", "x")

        mocked_open.side_effect = FileExistsError
        result = tool._run(file_path="newfile.txt")
        assert result == "File already exists"
        mocked_open.call_count == 2

    @pytest.mark.skip
    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_file_create_tool_with_crewai(self, agent, create_file_tool_setup_test_dir):
        """Test file create tool usage with crewai interface"""

        tool = create_file_tool_setup_test_dir
        path = Path(test_dir)
        abs_path = path.resolve()
        filename = "dummy.txt"

        agent.tools.append(tool)
        task = Task(
            description=f"""Create a file with a name {filename} in {abs_path}""",
            agent=agent,
            expected_output=f"""The response in the 
            following format using relative path:
            "I created a file {filename} in {path}." (without "")
            if file is succesfully created, "Error." if not""",
        )

        output = agent.execute_task(task)

        assert (path / filename).exists()
        assert output == f"I created a file {filename} in {path}."
