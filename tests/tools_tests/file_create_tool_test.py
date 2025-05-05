from crewai import Task
from pathlib import Path

import pytest
import pytest_mock
from pytest_mock import mocker

from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import create_file_tool_setup_test_dir
from tests.conftest import test_dir


class TestFileCreateTool:

    @pytest.mark.parametrize("is_filepath_passed_to_run", [
        True, False
    ])
    def test_create_tool(self, 
                         mocker, 
                         create_file_tool_setup_test_dir,
                         is_filepath_passed_to_run):
        """Test file creation"""

        tool = create_file_tool_setup_test_dir
        mocked_open = mocker.patch("builtins.open", mock_empty_file())

        result = tool._run(file_path="dummy.txt") if is_filepath_passed_to_run else tool._run()
        if is_filepath_passed_to_run:
            mocked_open.assert_called_once_with((Path(test_dir) / Path("dummy.txt")).resolve(), "x")
        else:
            mocked_open.assert_called_once_with(Path(test_dir).resolve(), "x")

        assert result == "File created successfully"

    def test_create_tool_file_exists(self, mocker, create_file_tool_setup_test_dir):
        """Test the attempt to create an already existing file"""

        tool = create_file_tool_setup_test_dir
        mocked_open = mocker.patch("builtins.open", mock_empty_file())

        result = tool._run(file_path="newfile.txt")
        assert result == "File created successfully"
        mocked_open.assert_called_once_with((Path(test_dir) / Path("newfile.txt")).resolve(), "x")

        mocked_open.side_effect = FileExistsError
        result = tool._run(file_path="newfile.txt")
        assert result == "File already exists"
        mocked_open.call_count == 2

    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_file_create_tool_with_crewai(self, agent, create_file_tool_setup_test_dir):
        """Test file create tool usage with crewai interface"""

        tool = create_file_tool_setup_test_dir
        path = Path(test_dir)
        filename = "dummy.txt"

        agent.tools.append(tool)
        task = Task(
            description=f"""Create a file with a name {filename}""",
            agent=agent,
            expected_output=f"""The response in the 
            following format using relative path:
            "I've created a file {filename} in (the full path to where it was created)." (without "")
            if file is succesfully created, "Error." if not""",
        )

        output = agent.execute_task(task)

        assert output == f"I've created a file {filename} in ./{filename}."
