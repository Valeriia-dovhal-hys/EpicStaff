from pathlib import Path
from shutil import rmtree

import pytest

from src.tools import AppendFileTool, EditFileTool
from src.tools.file_create_tool import CreateFileTool
from src.tools.file_count_lines import FileCountLinesTool
from src.tools.file_line_read_tool import LineReadFileTool


test_dir = "tests/tmp/"


@pytest.fixture
def create_file_tool():
    yield CreateFileTool("predefined.txt")


@pytest.fixture
def file_count_lines_tool():
    yield FileCountLinesTool("predefined.txt")


@pytest.fixture
def line_read_file_tool():
    yield LineReadFileTool("predefined.txt")


@pytest.fixture
def append_file_tool():
    yield AppendFileTool("predefined.txt")


@pytest.fixture
def edit_file_tool():
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    yield EditFileTool("predefined.txt")
    rmtree(path)






