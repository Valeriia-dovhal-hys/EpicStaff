import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch

from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import create_file_tool, file_count_lines_tool


class TestFileCreateTool:

    @pytest.mark.parametrize("file_passed, file_created", [
        (None, "predefined.txt"),
        ("newfile.txt", "newfile.txt"),
    ])
    def test_create_tool(self, mocker, create_file_tool, file_passed, file_created):
        '''Test file creation'''

        tool = create_file_tool
        mocked_open = mocker.patch("builtins.open", mock_empty_file())

        result = tool._run(file_path=file_passed) if file_passed is not None else tool._run()
        mocked_open.assert_called_once_with(file_created, "x")
        assert result == "File created successfully"


    def test_create_tool_file_exists(self, mocker, create_file_tool):
        '''Test the attempt to create an already existing file'''

        tool = create_file_tool 
        mocked_open = mocker.patch("builtins.open", mock_empty_file())

        result = tool._run(file_path="newfile.txt")
        assert result == "File created successfully"
        mocked_open.assert_called_once_with("newfile.txt", "x")

        mocked_open.side_effect = FileExistsError
        result = tool._run(file_path="newfile.txt")
        assert result == "File already exists"
        mocked_open.call_count == 2
