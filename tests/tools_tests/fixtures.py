from pathlib import Path
from shutil import rmtree

import pytest

from src.tools import AppendFileTool, EditFileTool, CreateFileTool, FileCountLinesTool, LineReadFileTool, CLITool
from tests.conftest import test_dir
from src.tools import FolderTool


lorem_text = """Sed ut perspiciatis, 
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
omnis voluptas assumenda est, omnis dolor repellendus. 

"""


@pytest.fixture
def create_file_tool_setup_test_dir(monkeypatch):
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("SAVE_FILE_PATH", test_dir)
    
    yield CreateFileTool()

    rmtree(path)


@pytest.fixture
def file_count_lines_tool_setup_test_dir(monkeypatch):
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("SAVE_FILE_PATH", test_dir)

    yield FileCountLinesTool()

    rmtree(path)


@pytest.fixture
def file_count_lines_tool():
    yield FileCountLinesTool()


@pytest.fixture
def file_line_read_tool(monkeypatch):
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("SAVE_FILE_PATH", test_dir)

    yield LineReadFileTool()

    rmtree(path)


@pytest.fixture
def append_file_tool(monkeypatch):
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("SAVE_FILE_PATH", test_dir)

    yield AppendFileTool()

    rmtree(path)


@pytest.fixture
def edit_file_tool(monkeypatch):
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("SAVE_FILE_PATH", test_dir)

    yield EditFileTool()

    rmtree(path)


@pytest.fixture
def folder_tool():
    path = Path(test_dir)
    path.mkdir(parents=True, exist_ok=True)

    yield FolderTool()

    rmtree(path)


@pytest.fixture
def interpreter_tool():
    yield CLITool()
