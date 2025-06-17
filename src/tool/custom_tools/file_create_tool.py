import logging
from typing import Optional, Type, Any

logger = logging.getLogger(__name__)

from pydantic import BaseModel, Field

from .route_tool import RouteTool


class CreateFileSchema(BaseModel):
    """Input for CreateFileTool."""

    file_path: Optional[str] = Field(
        ...,
        description=f"""The relative path where the file 
                                     should be created, including the file name itself""",
    )


class CreateFileTool(RouteTool):
    name: str = "Create a file"
    description: str = f"""A tool that's used to create a file in 
    a user-provided file path"""
    args_schema: Type[BaseModel] = CreateFileSchema

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._generate_description()

    def _run(
        self,
        **kwargs: Any,
    ) -> Any:
        try:
            file_path = kwargs.get("file_path", "./")
            file_savepath = self.construct_savepath(frompath=file_path)

            if not CreateFileTool.is_path_has_permission(file_savepath):
                return "Given filepath doesn't have access to the specified directory."
            with open(file_savepath.resolve(), "x") as file:
                return f"File created successfully in {file_path}"
        except FileExistsError:
            return f"File {file_path} already exists, no need to create it"
        except Exception as e:
            return f"Didn't manage to create a file. Unpredicted exception occured, I cannot figure out how to handle this {e}"
