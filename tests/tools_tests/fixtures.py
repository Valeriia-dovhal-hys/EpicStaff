import pytest
from src.tools.file_create_tool import CreateFileTool
from src.tools.file_count_lines import FileCountLinesTool

@pytest.fixture
def create_file_tool():
    yield CreateFileTool("predefined.txt")


@pytest.fixture
def file_count_lines_tool():
    yield FileCountLinesTool("predefined.txt")