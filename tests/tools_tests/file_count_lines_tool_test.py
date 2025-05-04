from crewai import Task
from pathlib import Path

import pytest
import pytest_mock
from pytest_mock import mocker

from tests.mocks.tools_mocks import mock_file_with_content
from tests.tools_tests.fixtures import (
    file_count_lines_tool,
    file_count_lines_tool_setup_test_dir,
)
from tests.conftest import test_dir


class TestFileCountLinesTool:

    @pytest.mark.parametrize(
        "lines_num_expected, lines_num_counted",
        [
            (0, 0),
            (5, 5),
        ],
    )
    def test_count_lines_tool(
        self, mocker, file_count_lines_tool, lines_num_expected, lines_num_counted
    ):
        """Test if the valid number of lines counted"""

        tool = file_count_lines_tool
        mocked_file_content = "Line\n" * lines_num_expected
        mocked_open = mocker.patch(
            "builtins.open", mock_file_with_content(mocked_file_content)
        )

        result = tool._run(file_path="dummy_path.txt")
        expected_call = mocker.call("dummy_path.txt", "r", encoding="utf-8")
        assert result == f"Total lines: {lines_num_counted}"
        assert mocked_open.call_args_list.count(expected_call) == 2

    @pytest.mark.parametrize(
        "file_passed, file_called, expectation, message",
        [
            (None, "predefined.txt", None, "Total lines: 1"),
            ("newfile.txt", "newfile.txt", None, "Total lines: 1"),
            (
                "not_exists.txt",
                "not_exists.txt",
                FileNotFoundError,
                "The file cannot be found, probably it doesn't exist",
            ),
            (
                "binary.exe",
                "binary.exe",
                UnicodeDecodeError("utf-8", b"", 0, 1, "invalid start byte"),
                "The file cannot be read as it may be a binary or non-text file",
            ),
            (
                "weird.txt",
                "weird.txt",
                Exception,
                "Didn't manage to read a file. Unpredicted exception occured, I cannot figure out how to handle this",
            ),
        ],
    )
    def test_count_lines_tool_open_file(
        self,
        mocker,
        file_count_lines_tool,
        file_passed,
        file_called,
        expectation,
        message,
    ):
        """Test if the file opens and can be read"""

        tool = file_count_lines_tool
        if expectation is None:
            mocked_open = mocker.patch(
                "builtins.open", mock_file_with_content("dummy_content")
            )
        else:
            mocked_open = mocker.patch("builtins.open", side_effect=expectation)
        result = (
            tool._run(file_path=file_passed) if file_passed is not None else tool._run()
        )

        expected_call = mocker.call(file_called, "r", encoding="utf-8")
        if expectation is None:
            assert mocked_open.call_args_list.count(expected_call) == 2
        else:
            assert mocked_open.call_args_list.count(expected_call) == 1
        assert result == message

    @pytest.mark.parametrize(
        "file_passed, is_dir, message",
        [
            ("file.txt", False, "Total lines: 1"),
            ("/iamdir", True, "The provided path is a directory, not a file name"),
        ],
    )
    def test_count_lines_tool_dir(
        self, mocker, file_count_lines_tool, file_passed, is_dir, message
    ):
        """Test whether the file_path passed is dir or not"""

        tool = file_count_lines_tool
        mocked_isdir = mocker.patch("os.path.isdir", return_value=is_dir)

        if not is_dir:
            mocked_open = mocker.patch(
                "builtins.open", mock_file_with_content("dummy_content")
            )
        result = (
            tool._run(file_path=file_passed)
            if file_passed is not None and not is_dir
            else tool._run()
        )

        expected_call = mocker.call(file_passed, "r", encoding="utf-8")
        assert result == message
        if not is_dir:
            assert mocked_open.call_args_list.count(expected_call) == 2

    @pytest.mark.skip
    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_count_lines_tool_with_crewai(
        self, agent, file_count_lines_tool_setup_test_dir
    ):
        """Test count lines tool usage with crewai interface"""

        file_path = Path(test_dir) / "dummy.txt"
        num_lines = 7
        file_path.write_text("dummy_content\n" * num_lines)
        abs_path = file_path.resolve()

        agent.tools.append(file_count_lines_tool_setup_test_dir)
        task = Task(
            description=f"""Count lines in {abs_path}""",
            agent=agent,
            expected_output=f"""The response in the 
            following format using relative path:
            The number of lines in {file_path}
            is {num_lines}.""",
        )

        output = agent.execute_task(task)
        assert output == f"The number of lines in {file_path} is {num_lines}."
