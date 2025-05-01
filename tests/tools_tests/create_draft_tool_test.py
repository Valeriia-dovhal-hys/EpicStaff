import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch

from tests.mocks.tools_mocks import mock_file_with_content, mock_empty_file
from tests.tools_tests.fixtures import line_read_file_tool
from src.tools.file_line_read_tool import LineReadFileTool

# todo: Ensure that create draft tool works
class TestCreateDraftTool:


    def test_create_draft(self, mocker):
        """Test create draft"""

        pass

