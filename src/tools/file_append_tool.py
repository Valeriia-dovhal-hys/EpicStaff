import os
import logging
from typing import Optional, Type, Any

logger = logging.getLogger(__name__)
logger.debug(f"Entered {__file__}")

from pydantic.v1 import BaseModel, Field, validator
from crewai_tools import BaseTool

from tools.route_tool import RouteTool


class AppendFileToolSchema(BaseModel):
    """Input for appending text to a file."""

    file_path: str = Field(
        ..., description="Mandatory file full path to append the text."
    )
    append_text: str = Field(
        ..., description="Mandatory text to be appended to the file."
    )


class AppendFileTool(RouteTool):
    name: str = "Append text to a file"
    description: str = "A tool that can be used to append text to a file."
    args_schema: Type[BaseModel] = AppendFileToolSchema

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._generate_description()

    def _run(
        self,
        **kwargs: Any,
    ) -> Any:
        try:
            file_path = kwargs.get("file_path")
            if file_path is None:
                return "file_path argument is mandatory and it wasn't given to the tool"

            file_savepath = self.construct_savepath(frompath=file_path)
            if not AppendFileTool.is_path_has_permission(file_savepath):
                return "Given filepath doesn't have access to the specified directory."
            
            append_text = kwargs.get("append_text")
            if append_text is None:
                return "append_text argument is mandatory and it wasn't given to the tool"
            
            with open(file_savepath, "a", encoding='utf-8') as file:
                file.write(append_text + "\n")
                
            return f"Text appended successfully to the file {file_path}."
        except Exception as e:
            return f"Didn't manage to append to a file. Unpredicted exception occured, I cannot figure out how to handle this {e}"
