import pytest
import pytest_mock
from pytest_mock import mocker, MockerFixture
from unittest.mock import patch, call, Mock

from src.tools import AppendFileTool
from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import append_file_tool


def mock_append_file_calls(file_name: str, appended_text: str):
	return [
		call(file_name, "a"),
		call().__enter__(),
		call().write(appended_text + "\n"),
		call().__exit__(None, None, None)
	]


def assert_append_file(calls, mocked_open, result):
	assert mocked_open.mock_calls == calls
	assert result == "Text appended successfully."


class TestFileAppendTool:

	def test_append_tool(self, mocker: MockerFixture, append_file_tool: AppendFileTool):
		"""Test file append tool"""

		text_lines = ["Line 1", "Line 2\n", "\n\n\n\tLine 3 blablabla", ""]
		file_name = "text_file.txt"
		tool = append_file_tool
		mocked_open = mocker.patch("builtins.open", mock_empty_file())

		calls = []

		for text_line in text_lines:
			result = tool._run(file_path=file_name, append_text=text_line)
			calls += mock_append_file_calls(file_name, text_line)
			assert_append_file(calls=calls, mocked_open=mocked_open, result=result)

	def test_run_without_append_text_type_error(self, mocker: MockerFixture, append_file_tool: AppendFileTool):
		""" Test running file append tool with no append text """
		tool = append_file_tool
		mocker.patch("builtins.open", mock_empty_file())
		with pytest.raises(TypeError) as exc_info:
			None + "str"  # This will raise a TypeError

		result = tool._run()

		assert result == f"Failed to append text: {exc_info.value}"


