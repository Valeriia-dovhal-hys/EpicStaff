from pathlib import Path
from textwrap import dedent

import pytest
import pytest_mock
from pytest_mock import mocker, MockerFixture
from unittest.mock import patch, call, Mock

from src.tools import AppendFileTool, EditFileTool
from tests.mocks.tools_mocks import mock_file_with_content
from tests.tools_tests.fixtures import edit_file_tool, test_dir, lorem_text


class TestFileEditTool:
	test_text = lorem_text

	@pytest.mark.parametrize("file_path, line_number, expected_text, new_text", [
		("file.txt", 1, "Sed ut perspiciatis, ", "Changed 1 line"),
		(
			"file.txt",
			6,
			"aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, ",
			"Changed 6 line"
		),
		("file.txt", 20, "", f"Changed 20 line{"\n" * 10}"),
	])
	def test_edit_tool(
			self,
			edit_file_tool: EditFileTool,
			file_path: str,
			line_number: int,
			expected_text: str,
			new_text: str
	):
		"""Test file edit tool"""

		with open(Path(test_dir) / file_path, "w") as f:
			f.write(self.test_text)

		tool = edit_file_tool

		result = tool._run(
			file_path=file_path,
			line_number=line_number,
			expected_text=expected_text,
			new_text=new_text,
		)
		assert result == f"Line {line_number} in the file {file_path} edited successfully."
		text_lines = self.test_text.splitlines(keepends=False)
		text_lines[line_number - 1] = new_text
		expected = "\n".join(text_lines)

		with open(Path(test_dir) / file_path, "r") as f:
			data = f.read()

		assert data == expected

	@pytest.mark.parametrize("file_path, line_number", [
		("file.txt", 21),
		("file.txt", -3),
		("file.txt", 0)

	])
	def test_edit_tool_with_wrong_line_numbers(
			self,
			edit_file_tool: EditFileTool,
			file_path: str,
			line_number: int,
	):
		"""Test file edit tool with wrong line numbers"""
		with open(Path(test_dir) / file_path, "w") as f:
			f.write(self.test_text)

		tool = edit_file_tool

		result = tool._run(
			file_path=file_path,
			line_number=line_number,
			expected_text="",
			new_text="",
		)
		assert result == dedent(
			f"""
				There is an error: Line number {line_number} is out of the file's range. 
				The file has {len(self.test_text.splitlines())} lines. The first line is line 1."""
		)

	@pytest.mark.parametrize("file_path, line_number, expected_text, new_text", [
		("file.txt", 2, "Sed ut perspiciatis, ", "Changed 2 line"),
		("file.txt", 7,
				"BLABLABLA",
				"Changed 7 line"
		),
		("file.txt", 20, " " * 3, "\n" * 10),
	])
	def test_edit_tool_with_wrong_expected_text(
			self,
			edit_file_tool: EditFileTool,
			file_path: str,
			line_number: int,
			expected_text: str,
			new_text: str
	):
		"""Test file edit tool with wrong expected text"""
		with open(Path(test_dir) / file_path, "w") as f:
			f.write(self.test_text)

		tool = edit_file_tool

		result = tool._run(
			file_path=file_path,
			line_number=line_number,
			expected_text=expected_text,
			new_text=new_text,
		)
		assert result == f"There is an error: Expected text does not match the text on line {line_number}."


	# TODO: Due to the construct_savepath injection
	# this exception here is unreachable in a way
	# it was designed earlier, need to catch other type 
	# of error or reconsider the tool logic itself
	@pytest.mark.skip
	@pytest.mark.parametrize("file_path", [
		("file.txtsfa",),
		("fil a s fze.txt"),

	])
	def test_edit_tool_error_reading_file(
			self,
			mocker: MockerFixture,
			edit_file_tool: EditFileTool,
			file_path: str,
	):
		"""Test file edit tool with wrong line numbers"""
		tool = edit_file_tool

		result: str = tool._run(
			file_path=file_path
		)
		assert result.startswith(f"There was an error reading the file {file_path}: ")
