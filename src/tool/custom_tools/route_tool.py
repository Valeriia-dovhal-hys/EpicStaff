import os
from pathlib import Path
from typing import Optional, Any

from crewai.tools import BaseTool
#TODO: change import after update: from crewai.tools import BaseTool 


class RouteTool(BaseTool):
    name: str = "Parent tool for tools that operate with paths"
    description: str = f"""Does nothing by itself, exists only to provide 
    base functionality to its child"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def _run(self, **kwargs: Any):
        pass

    @staticmethod
    def _is_path_within_path(source_path: Path, dest_path: Path) -> bool:
        source_path = source_path.resolve()
        dest_path = dest_path.resolve()

        return dest_path in source_path.parents or source_path == dest_path
    
    @staticmethod
    def is_path_has_permission(path: Path | str) -> bool:
        save_file_path = os.getenv("SAVE_FILE_PATH")
        return RouteTool._is_path_within_path(path, Path(save_file_path))
    
    def construct_savepath(self, *, frompath: Path | str) -> Path:
        save_file_path = os.getenv("SAVE_FILE_PATH")
        return Path(save_file_path) / Path(frompath)