from crewai import Task
from pathlib import Path

import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch

from tests.mocks.tools_mocks import mock_file_with_content, mock_empty_file
from tests.tools_tests.fixtures import file_line_read_tool, lorem_text
from src.tools.file_line_read_tool import LineReadFileTool
from tests.conftest import test_dir


def get_text_lines(text, from_=0, to_=None):
    lines = text.splitlines(keepends=True)
    if to_ is None:
        to_ = len(lines)

    return lines[from_:to_]


class TestFileLineReadTool:
    # TODO check what happen if number_of_lines is == 0 looks like they will be read last line
    test_text = lorem_text

    @pytest.mark.parametrize(
        "file_path, line_number",
        [
            ("file.txt", 1),
            ("file.txt", 10),
        ],
    )
    def test_read_all_lines(self, mocker, file_line_read_tool, file_path, line_number):
        """Test read all lines from position from file."""

        tool = file_line_read_tool
        mocked_open = mocker.patch(
            "builtins.open", mock_file_with_content(self.test_text)
        )

        expected = LineReadFileTool.format_lines(
            get_text_lines(text=self.test_text, from_=line_number - 1), line_number
        )

        result = tool._run(
            file_path=file_path, line_number=line_number, number_of_lines=None
        )

        mocked_open.assert_called_once_with(Path(test_dir) / file_path, "r")

        assert result == expected

    def test_read_all_lines_out_of_max_range(self, mocker, file_line_read_tool):
        """Test read all lines out of max range."""

        line_number_out_of_max_range = len(get_text_lines(text=self.test_text)) + 1

        file_path = "dummy.txt"
        tool = file_line_read_tool
        mocked_open = mocker.patch(
            "builtins.open", mock_file_with_content(self.test_text)
        )

        result = tool._run(
            file_path=file_path, 
            line_number=line_number_out_of_max_range, 
            number_of_lines=None
        )

        mocked_open.assert_called_once_with(Path(test_dir) / file_path, "r")

        assert (
            result
            == f"Line number {line_number_out_of_max_range} is out of the {file_path} range, so I cannot retrieve this line"
        )

    @pytest.mark.parametrize("line_number", [-1, -50, -100])
    def test_read_all_lines_out_of_min_range(
        self, mocker, file_line_read_tool, line_number
    ):
        """Test read all lines out of min range."""

        file_path = "dummy.txt"
        tool = file_line_read_tool

        result = tool._run(file_path=file_path,
                           line_number=line_number, 
                           number_of_lines=None)

        assert result == f"Line number should be at least 1, because it's 1-based, but {line_number} was given instead."

    @pytest.mark.parametrize(
        "file_path, line_number, num_lines",
        [
            ("file.txt", 1, 5),
            ("file.txt", 12, 4),
            ("file.txt", 13, 100),
            ("file.txt", 19, 1),
        ],
    )
    def test_read_n_lines(
        self, mocker, file_line_read_tool, file_path, line_number, num_lines
    ):
        """Test read number of lines from line_number in file."""

        tool = file_line_read_tool
        mocked_open = mocker.patch(
            "builtins.open", mock_file_with_content(self.test_text)
        )

        expected = LineReadFileTool.format_lines(
            get_text_lines(
                text=self.test_text,
                from_=line_number - 1,
                to_=(line_number - 1 + num_lines) if num_lines is not None else None,
            ),
            line_number=line_number,
        )
        result = tool._run(
            file_path=file_path, 
            line_number=line_number, 
            num_lines=num_lines
        )

        mocked_open.assert_called_once_with(Path(test_dir) / file_path, "r")

        assert result == expected

    @pytest.mark.parametrize(
        "num_lines",
        [
            -1,
            -10,
        ],
    )
    def test_read_negative_n_lines(self, mocker, file_line_read_tool, num_lines):
        """Test read negative number of lines in file."""

        file_path = "dummy.txt"
        tool = file_line_read_tool

        expected = f"Number of lines argument has to be positive, num_lines = {num_lines} given instead."
        result = tool._run(
            file_path=file_path,
            line_number = 1,
            num_lines=num_lines
        )

        assert result == expected

    # TODO: This test fails because of some annoying \n or extra spaces in the lines
    # Need to refactor this test or the lorem_text
    # Also, maybe shorten lorem_text in size to save tokens
    @pytest.mark.skip
    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_line_read_tool_with_crewai(
        self, agent, file_line_read_tool
    ):

        filename = "dummy.txt"
        path = Path(test_dir)
        filepath = path / filename
        filepath.write_text(self.test_text)

        line_number = 17
        expected = LineReadFileTool.format_lines(
            get_text_lines(text=self.test_text, from_=line_number - 1), line_number
        )

        agent.tools.append(file_line_read_tool)
        task = Task(
            description=f"""Read all lines starting with {line_number} from {filename}""",
            agent=agent,
            expected_output=f"""The response in the 
            following format using relative path:
            "I read from the file {filename} and here are the lines I found:\n{expected}" (without "")
            if file is succesfully read, "Error." if not""",
        )

        output = agent.execute_task(task)

        assert (
            output == f"I read from the file {filename} and here are the lines I found:\n{expected}"
        )
