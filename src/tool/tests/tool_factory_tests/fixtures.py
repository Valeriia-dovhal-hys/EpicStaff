from pathlib import Path
from shutil import rmtree

import pytest

from tool_factory import DynamicToolFactory


@pytest.fixture
def dynamic_tool_factory():
    dynamic_tool_factory = DynamicToolFactory()
    yield dynamic_tool_factory
    
    DynamicToolFactory._instances = {}


