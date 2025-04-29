import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch

from tests.mocks.tools_mocks import mock_empty_file, mock_file_with_content
from src.tools.file_create_tool import CreateFileTool
from src.tools.file_count_lines import FileCountLinesTool

import random

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

# ===============================================
# Section: Testing file_count_lines
# ===============================================

def test_count_lines_tool(mocker):
    '''Test if the valid number of lines counted'''

    tool = FileCountLinesTool()

    lines_num = random.randint(10, 25)
    mocked_file_content = "Line\n" * lines_num
    mocked_open = mocker.patch("builtins.open", mock_file_with_content(mocked_file_content))

    result = tool._run(file_path="dummy_path.txt")
    assert result == f"Total lines: {lines_num}"
    mocked_open.assert_called_once_with("dummy_path.txt", "r")


def test_count_lines_tool_open_file_no_args(mocker):
    '''Test file read if no arguments given'''

    tool = FileCountLinesTool("test.txt")

    mocked_open = mocker.patch("builtins.open", mock_file_with_content("dummy_content"))
    result = tool._run()

    mocked_open.assert_called_once_with("test.txt", "r")
    assert result == "Total lines: 1"


def test_count_lines_tool_open_file_with_args(mocker):
    '''Test file read if arguments were given'''

    tool = FileCountLinesTool("test.txt")

    mocked_open = mocker.patch("builtins.open", mock_file_with_content("dummy_content"))
    result = tool._run(file_path="file.txt")

    mocked_open.assert_called_once_with("file.txt", "r")
    assert result == "Total lines: 1"


def test_count_lines_tools_no_file(mocker):
    '''Test if the file cannot be found'''

    tool = FileCountLinesTool("test.txt")

    mocked_open = mocker.patch("builtins.open", side_effect=FileNotFoundError("File not Found"))
    result = tool._run(file_path="file.txt")

    assert "Error reading file: File not Found" in result
    mocked_open.assert_called_once_with("file.txt", "r")