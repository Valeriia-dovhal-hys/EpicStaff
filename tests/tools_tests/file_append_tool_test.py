from pathlib import Path

import pytest
import pytest_mock
from pytest_mock import mocker, MockerFixture
from unittest.mock import patch, call, Mock

from src.tools import AppendFileTool
from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import append_file_tool, test_dir




class TestFileAppendTool:

	def test_append_tool(self, append_file_tool: AppendFileTool):
		"""Test file append tool"""

		text_lines = ["Line 1", "Line 2\n", "\n\n\n\tLine 3 blablabla", ""]
		file_name = "text_file.txt"
		file_path = Path(test_dir) / file_name
		tool = append_file_tool

		text = ""
		for line in text_lines:
			result = tool._run(file_path=file_path, append_text=line)
			assert result == "Text appended successfully."
			text += line+"\n"

			with open(file_path) as f:
				assert f.read() == text

	def test_run_without_append_text_type_error(self, mocker: MockerFixture, append_file_tool: AppendFileTool):
		""" Test running file append tool with no append text """
		tool = append_file_tool
		mocker.patch("builtins.open", mock_empty_file())
		with pytest.raises(TypeError) as exc_info:
			None + "str"  # This will raise a TypeError

		result = tool._run()

		assert result == f"Failed to append text: {exc_info.value}"


