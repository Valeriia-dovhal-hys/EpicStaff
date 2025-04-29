import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch

from tests.mocks.tools_mocks import mock_empty_file
from src.tools.file_create_tool import CreateFileTool
from src.tools.file_count_lines import FileCountLinesTool

# ===============================================
# Section: Testing file_create_tool
# ===============================================

def test_create_tool_no_args(mocker):
    '''Test file creation without arguments given'''

    tool = CreateFileTool(file_path="test.txt")
    
    mocked_open = mocker.patch("builtins.open", mock_empty_file())
    result = tool._run()
    mocked_open.assert_called_once_with("test.txt", "x")
    assert result == "File created successfully."


def test_create_tool_with_args(mocker):
    '''Test file creation with arguments given'''

    tool = CreateFileTool(file_path="test.txt")

    mocked_open = mocker.patch("builtins.open", mock_empty_file())
    result = tool._run(file_path="file.txt")
    mocked_open.assert_called_once_with("file.txt", "x")
    assert result == "File created successfully."


def test_create_tool_file_exists(mocker):
    '''Test the attempt to create an already existing file'''

    tool = CreateFileTool(file_path="test.txt") 
    mocked_open = mocker.patch("builtins.open", mock_empty_file())

    result = tool._run(file_path="file.txt")
    assert result == "File created successfully."
    mocked_open.assert_called_once_with("file.txt", "x")

    mocked_open.side_effect = FileExistsError
    result = tool._run(file_path="file.txt")
    assert result == "File already exists."
    mocked_open.call_count == 2

