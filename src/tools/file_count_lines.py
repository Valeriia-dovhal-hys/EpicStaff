import os
import logging
import encodings

logger = logging.getLogger(__name__)
logger.debug(f"Entered {__file__}")
import encodings.aliases
from langchain.tools import tool
from typing import Optional, Type, Any
from pydantic.v1 import BaseModel, Field, validator
from crewai_tools import BaseTool

from src.tools.route_tool import RouteTool


class FileCountLinesToolSchema(BaseModel):
    """Input for FileCountLinesTool"""

    file_path: str = Field(..., description="Mandatory argument: the path to the file.")


class FileCountLinesTool(RouteTool):
    name: str = "Count a file's lines"
    description: str = (
        "A tool that can be used to count the number of lines in a file from a given filepath."
    )
    args_schema: Type[BaseModel] = FileCountLinesToolSchema

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._generate_description()

    def _run(
        self,
        **kwargs: Any,
    ) -> Any:
        file_path = kwargs.get("file_path")
        if file_path is None:
            return "file_path argument is mandatory and it wasn't given to the tool"
        
        file_savepath = self.construct_savepath(frompath=file_path)
        if not FileCountLinesTool.is_path_has_permission(file_savepath):
            return "Given filepath doesn't have access to the specified directory."
        
        try:
            if os.path.isdir(file_path):
                return "The provided path is a directory, not a file name"
            encoding = self._retrieve_encoding(file_path=file_path)
            with open(file_path, "r", encoding=encoding) as file:
                return f"Total lines: {sum(1 for _ in file)}"
        except ValueError:
            return "The file cannot be read as it may be a binary or non-text file"
        except FileNotFoundError:
            return "The file cannot be found, probably it doesn't exist"
        except Exception as e:
            return f"Didn't manage to read a file. Unpredicted exception occured, I cannot figure out how to handle this"

    @staticmethod
    def _get_sorted_encodings():
        """Returns encodings sorted by their use frequencies"""

        common_encodings = [
            "utf-8",
            "ascii",
            "utf-16",
            "utf-32",
            "cp1251",
            "cp1252",
            "latin-1",
            "iso-8859-1",
            "iso-8859-2",
        ]
        low_frequency_encodings = list(
            set(encodings.aliases.aliases.values()) - set(common_encodings)
        )
        sorted_encodings = common_encodings + low_frequency_encodings

        return sorted_encodings

    def _retrieve_encoding(self, file_path):
        """Tries to open the file with all possible encodings starting with more frequent"""

        for encoding in self._get_sorted_encodings():
            try:
                with open(file_path, "r", encoding=encoding) as file:
                    return encoding
            except (UnicodeDecodeError, LookupError):
                continue
        raise ValueError("Failed to decode the file with any available decoding")
