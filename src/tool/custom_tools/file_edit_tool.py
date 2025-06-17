import logging
from textwrap import dedent

logger = logging.getLogger(__name__)
from typing import Type, Any
from pydantic import BaseModel, Field

from .route_tool import RouteTool


class FileEditToolSchema(BaseModel):
    """Input for EditFileTool."""

    file_path: str = Field(..., description="Mandatory file full path to edit the file")
    line_number: int = Field(
        ..., description="Mandatory line number (1-based) to edit."
    )
    expected_text: str = Field(
        ..., description="Mandatory text to be replaced on the specified line."
    )
    new_text: str = Field(
        ..., description="Mandatory new text to replace the expected text."
    )


class EditFileTool(RouteTool):
    name: str = "Edit a file's line"
    description: str = "A tool that can be used to edit a specific line in a file."
    args_schema: Type[BaseModel] = FileEditToolSchema

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._generate_description()

    def _run(
        self,
        **kwargs: Any,
    ) -> Any:
        file_path = kwargs.get("file_path")
        line_number = kwargs.get("line_number")
        expected_text = kwargs.get("expected_text")
        new_text = kwargs.get("new_text")

        # TODO: Make a conscise functionality to check whether all these mandatory
        # fields are not None

        file_savepath = self.construct_savepath(frompath=file_path)
        if not EditFileTool.is_path_has_permission(file_savepath):
            return "Given filepath doesn't have access to the specified directory."

        try:
            with open(file_savepath, "r") as file:
                lines = file.read().splitlines()
        except Exception as e:
            return f"There was an error reading the file {file_path}: {e}"

        # Check if the line number is within the file's range
        if not 1 <= line_number <= len(lines):
            return dedent(
                f"""
                    There is an error: Line number {line_number} is out of the file's range. 
                    The file has {len(lines)} lines. The first line is line 1."""
            )

        # Check if the expected text matches the current line content
        current_line = lines[line_number - 1]

        if expected_text is not None and current_line != expected_text:
            return f"There is an error: Expected text does not match the text on line {line_number}."

        # Replace the line with new text
        lines[line_number - 1] = new_text

        text = "\n".join(lines)

        # Write the updated lines back to the file directly within this method
        try:
            with open(file_savepath, "w") as file:
                file.writelines(text)
        except Exception as e:
            return f"There was an eeror writing to file {file_path}: {e}"

        return f"Line {line_number} in the file {file_path} edited successfully."
