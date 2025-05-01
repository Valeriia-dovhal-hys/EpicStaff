import pytest
from src.tools.file_create_tool import CreateFileTool
from src.tools.file_count_lines import FileCountLinesTool
from src.tools.file_line_read_tool import LineReadFileTool

@pytest.fixture
def create_file_tool():
    yield CreateFileTool("predefined.txt")


@pytest.fixture
def file_count_lines_tool():
    yield FileCountLinesTool("predefined.txt")


@pytest.fixture
def line_read_file_tool():
    yield LineReadFileTool("predefined.txt")
