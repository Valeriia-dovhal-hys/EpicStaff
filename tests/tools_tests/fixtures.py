from pathlib import Path
from shutil import rmtree

import pytest

from src.tools import AppendFileTool, EditFileTool, CreateFileTool, FileCountLinesTool, LineReadFileTool
from tests.conftest import test_dir
from src.tools import FolderTool




@pytest.fixture
def create_file_tool():
    yield CreateFileTool("predefined.txt")


@pytest.fixture
def create_file_tool_setup_test_dir():
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    
    yield CreateFileTool()

    rmtree(path)


@pytest.fixture
def file_count_lines_tool_setup_test_dir():
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)

    yield FileCountLinesTool()

    rmtree(path)


@pytest.fixture
def file_count_lines_tool():
    yield FileCountLinesTool("predefined.txt")


@pytest.fixture
def line_read_file_tool():
    yield LineReadFileTool("predefined.txt")


@pytest.fixture
def append_file_tool():
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)

    yield AppendFileTool()

    rmtree(path)


@pytest.fixture
def edit_file_tool():
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    yield EditFileTool("predefined.txt")
    rmtree(path)


@pytest.fixture
def folder_tool():
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    yield FolderTool()
    rmtree(path)






