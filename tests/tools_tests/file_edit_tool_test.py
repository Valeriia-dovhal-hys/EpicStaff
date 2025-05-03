import pytest
import pytest_mock
from pytest_mock import mocker, MockerFixture
from unittest.mock import patch, call, Mock

from src.tools import AppendFileTool, EditFileTool
from tests.mocks.tools_mocks import mock_file_with_content
from tests.tools_tests.fixtures import edit_file_tool, test_dir


class MockWriter:
	"""Collect all written data."""

	def __init__(self):
		self.contents = ''

	def write(self, data):
		self.contents += data


class TestFileEditTool:
	test_text = """Sed ut perspiciatis, 
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

	@pytest.mark.parametrize("file_path, line_number, expected_text, new_text", [
		(test_dir + "file.txt", 1, "Sed ut perspiciatis, ", "Changed 1 line"),
		(
				test_dir + "file.txt",
				6,
				"aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, ",
				"Changed 6 line"
		),
		(test_dir + "file.txt", 20, "", "Changed 20 line\n\n\n\n\n\n\n\n\n\n"),
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

		with open(file_path, "w") as f:
			f.write(self.test_text)

		tool = edit_file_tool

		result = tool._run(
			file_path=file_path,
			line_number=line_number,
			expected_text=expected_text,
			new_text=new_text,
		)
		assert result == "Line edited successfully."
		text_lines = self.test_text.splitlines(keepends=False)
		text_lines[line_number - 1] = new_text
		expected = "\n".join(text_lines)

		with open(file_path, "r") as f:
			data = f.read()

		assert data == expected

	@pytest.mark.parametrize("file_path, line_number", [
		(test_dir + "file.txt", 21),
		(test_dir + "file.txt", -1),
		(test_dir + "file.txt", 0),
		(test_dir + "file.txt", -40),
		(test_dir + "file.txt", 40),
		(test_dir + "file.txt", 12124124142),

	])
	def test_edit_tool_with_wrong_line_numbers(
			self,
			edit_file_tool: EditFileTool,
			file_path: str,
			line_number: int,
	):
		"""Test file edit tool with wrong line numbers"""
		with open(file_path, "w") as f:
			f.write(self.test_text)

		tool = edit_file_tool

		result = tool._run(
			file_path=file_path,
			line_number=line_number,
			expected_text="",
			new_text="",
		)
		assert result == f"I made an error: Line number {line_number} is out of the file's range. The file has {len(self.test_text.splitlines())} lines. The first line is line 1."

	@pytest.mark.parametrize("file_path, line_number, expected_text, new_text", [
		(test_dir + "file.txt", 2, "Sed ut perspiciatis, ", "Changed 2 line"),
		(test_dir + "file.txt", 7,
				"BLABLABLA",
				"Changed 7 line"
		),
		(test_dir + "file.txt", 20, "   ", "\n\n\n\n\n\n\n\n\n\n"),
	])
	def test_edit_tool_with_wrong_expected_text(
			self,
			edit_file_tool: EditFileTool,
			file_path: str,
			line_number: int,
			expected_text: str,
			new_text: str
	):
		"""Test file edit tool with wrong line numbers"""
		with open(file_path, "w") as f:
			f.write(self.test_text)

		tool = edit_file_tool

		result = tool._run(
			file_path=file_path,
			line_number=line_number,
			expected_text=expected_text,
			new_text=new_text,
		)
		assert result == f"I made an Error: Expected text does not match the text on line {line_number}."

	@pytest.mark.parametrize("file_path", [
		(test_dir + "file.txtsfa",),
		(test_dir + "fil a s fze.txt"),

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
