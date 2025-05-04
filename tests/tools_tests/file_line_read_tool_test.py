from crewai import Task
from pathlib import Path

import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch

from tests.mocks.tools_mocks import mock_file_with_content, mock_empty_file
from tests.tools_tests.fixtures import (
    file_line_read_tool,
    file_line_read_tool_setup_test_dir,
)
from src.tools.file_line_read_tool import LineReadFileTool
from tests.conftest import test_dir


def get_text_lines(text, from_=0, to_=None):
    lines = text.splitlines(keepends=True)
    if to_ is None:
        to_ = len(lines)

    return lines[from_:to_]


class TestFileLineReadTool:
    test_text = """Sed ut perspiciatis, 
    unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
    totam rem aperiam eaque ipsa, 
    quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. 
    Nemo enim ipsam voluptatem, quia voluptas sit, 
    aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, 
    qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, 
    quia dolor sit, amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt, 
    ut labore et dolore magnam aliquam quaerat voluptatem. 
    Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, 
    nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit, 
    qui in ea voluptate velit esse, quam nihil molestiae consequatur, vel illum, qui dolorem eum fugiat, 
    quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus, 
    qui blanditiis praesentium voluptatum deleniti atque corrupti, quos dolores et quas molestias excepturi sint, 
    obcaecati cupiditate non provident, similique sunt in culpa, qui officia deserunt mollitia animi, 
    id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. 
    Nam libero tempore, cum soluta nobis est eligendi optio, 
    cumque nihil impedit, quo minus id, quod maxime placeat, facere possimus, 
    omnis voluptas assumenda est, omnis dolor repellendus."""

    @pytest.mark.parametrize(
        "file_path, line_number",
        [
            ("file.txt", 1),
            ("file.txt", 12),
            ("file.txt", 13),
            ("file.txt", 19),
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

        mocked_open.assert_called_once_with(file_path, "r")

        assert result == expected

    def test_read_all_lines_out_of_max_range(self, mocker, file_line_read_tool):
        """Test read all lines out of max range."""

        line_number_out_of_max_range = len(get_text_lines(text=self.test_text)) + 1

        tool = file_line_read_tool
        mocked_open = mocker.patch(
            "builtins.open", mock_file_with_content(self.test_text)
        )

        result = tool._run(
            line_number=line_number_out_of_max_range, number_of_lines=None
        )

        mocked_open.assert_called_once_with(tool.file_path, "r")

        assert (
            result
            == f"I made a mistake: Line number {line_number_out_of_max_range} is out of the file's range."
        )

    @pytest.mark.parametrize("line_number", [-1, -50, -100])
    def test_read_all_lines_out_of_min_range(
        self, mocker, file_line_read_tool, line_number
    ):
        """Test read all lines out of min range."""

        tool = file_line_read_tool

        result = tool._run(line_number=line_number, number_of_lines=None)

        assert result == "I made a mistake, I forgot that the first line is 1."

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
            file_path=file_path, line_number=line_number, num_lines=num_lines
        )

        mocked_open.assert_called_once_with(file_path, "r")

        assert result == expected

    @pytest.mark.parametrize(
        "num_lines",
        [
            -4,
            -5,
            -2,
            -11,
        ],
    )
    def test_read_negative_n_lines(self, mocker, file_line_read_tool, num_lines):
        """Test read negative number of lines in file."""

        tool = file_line_read_tool

        expected = "I made a mistake, I forgot that number of lines has to be positive."
        result = tool._run(num_lines=num_lines)

        assert result == expected

    @pytest.mark.skip
    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_line_read_tool_with_crewai(
        self, agent, file_line_read_tool_setup_test_dir
    ):

        filename = "dummy.txt"
        path = Path(test_dir)
        filepath = path / filename
        filepath.write_text(self.test_text)
        abs_path = filepath.resolve()

        line_number = 17
        expected = LineReadFileTool.format_lines(
            get_text_lines(text=self.test_text, from_=line_number - 1), line_number
        )

        agent.tools.append(file_line_read_tool_setup_test_dir)
        task = Task(
            description=f"""Read all lines starting with {line_number} from {abs_path}""",
            agent=agent,
            expected_output=f"""The response in the 
            following format using relative path:
            "I read from the file {filename} in {filepath} and here are the lines I found: \n {expected}" (without "")
            if file is succesfully read, "Error." if not""",
        )

        output = agent.execute_task(task)

        assert (
            output
            == f"I read from the file {filename} in {filepath} and here are the lines I found: \n {expected}"
        )
