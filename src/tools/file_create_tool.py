import os
import logging
from typing import Optional, Type, Any

logger = logging.getLogger(__name__)

from pydantic.v1 import BaseModel, Field
from crewai_tools import BaseTool

from src.tools.route_tool import RouteTool

SAVE_FILE_PATH = os.getenv("SAVE_FILE_PATH")


class CreateFileSchema(BaseModel):
    """Input for CreateFileTool."""

    file_name: str = Field(..., description="Mandatory field with the name of the file to create")
    file_path: Optional[str] = Field(..., description=f"""The relative path where the file 
                                     should be created within the {SAVE_FILE_PATH} directory, 
                                     excluding the file name itself""")


class CreateFileTool(RouteTool):
    name: str = "Create a file"
    description: str = f"""A tool that's used to create a file in 
    a directory {SAVE_FILE_PATH} combined with a user-provided file path if it's given.
    Otherwise, tool should be used to create a file in {SAVE_FILE_PATH} directory."""
    args_schema: Type[BaseModel] = CreateFileSchema
    file_path: Optional[str] = None

    def __init__(self, file_name, file_path: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)

        self.file_name = file_name
        self.file_path = file_path
        self._generate_description()

    def _run(
        self,
        **kwargs: Any,
    ) -> Any:
        try:
            file_path = kwargs.get("file_path", self.file_path)

            if file_path is None:
                return "No filepath provided."
            elif not CreateFileTool.is_path_has_permission(file_path):
                return "Given filepath doesn't have access to the specified directory."
            with open(file_path, "x") as file:
                return "File created successfully"
        except FileExistsError:
            return "File already exists"
        except Exception:
            return "Didn't manage to create a file. Unpredicted exception occured, I cannot figure out how to handle this"
