import logging

logger = logging.getLogger(__name__)
from typing import Optional, Type, Any, List
from pydantic import BaseModel, Field

from .route_tool import RouteTool


class LineReadFileToolSchema(BaseModel):
    """Input for LineReadFileTool"""

    file_path: str = Field(..., description="Mandatory file full path to read the file")
    line_number: int = Field(
        ..., description="Mandatory line number (1-based) to start reading from."
    )
    num_lines: Optional[int] = Field(
        ...,
        description="Optional number of lines to read from the starting line. If not specified, reads all lines starting from `line_number`.",
    )


class LineReadFileTool(RouteTool):
    name: str = "Read a file's content starting with line number given"
    description: str = (
        "A tool that can be used to read a file's content starting with the line number given."
    )
    args_schema: Type[BaseModel] = LineReadFileToolSchema

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._generate_description()

    def _run(self, **kwargs: Any) -> Any:
        file_path = kwargs.get("file_path")
        line_number = kwargs.get("line_number")
        num_lines = kwargs.get("num_lines")

        file_savepath = self.construct_savepath(frompath=file_path)
        if not self.is_path_has_permission(file_savepath):
            return "Given filepath doesn't have access to the specified directory."

        # TODO: Make a concise functionality to check whether all these mandatory
        # fields are not None

        if num_lines is not None:
            if num_lines == 0:
                num_lines = None  # Normalize zero to None to indicate "read all lines"
            elif num_lines < 1:
                return f"Number of lines argument has to be positive, num_lines = {num_lines} given instead."

        # Ensure line_number starts at least from 1
        if line_number < 1:
            return f"Line number should be at least 1, because it's 1-based, but {line_number} was given instead."

        with open(file_savepath, "r") as file:
            lines = file.readlines()

        # Validate line_number to ensure it's within the range of the file's line count.
        if line_number > len(lines):
            return f"Line number {line_number} is out of the {file_path} range, so I cannot retrieve this line"

        # Calculate the end index for slicing lines; handle case where num_lines is None
        end_index = (line_number - 1) + num_lines if num_lines else len(lines)
        selected_lines = lines[
            line_number - 1 : end_index
        ]  # Adjust for zero-based index

        if not selected_lines:
            return f"No lines found starting from the specified line number in {file_path}."

        # Format output to include line numbers with their respective contents
        content = self.format_lines(selected_lines, line_number)

        return content

    @staticmethod
    def format_lines(lines: List[str], line_number: int) -> str:
        return "".join(
            [f"{idx + line_number}: {line}" for idx, line in enumerate(lines)]
        )
