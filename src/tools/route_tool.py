import os
from pathlib import Path
from typing import Optional, Any

from crewai_tools import BaseTool


SAVE_FILE_PATH = os.getenv("SAVE_FILE_PATH")


class RouteTool(BaseTool):
    name: str = "Parent tool for tools that operate with paths"
    description: str = f"""Does nothing by itself, exists only to provide 
    base functionality to its child"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def _run(self, **kwargs: Any):
        pass

    @staticmethod
    def _is_path_within_path(source_path: Path, dest_path: Path):
        source_path = source_path.resolve()
        dest_path = dest_path.resolve()

        return dest_path in source_path.parents or source_path == dest_path
    
    # TODO: it won't always work as it should for paths with /../../../ and so on, should
    # consider this case for safety reasons as well
    @staticmethod
    def is_path_has_permission(path: Path | str):
        path = Path(path)
        return RouteTool._is_path_within_path(path, Path(SAVE_FILE_PATH))