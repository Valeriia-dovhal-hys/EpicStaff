from abc import ABC
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel, Field, PrivateAttr

from crewai.utilities.printer import Printer


class Logger(BaseModel):
    verbose: bool = Field(default=False)
    _printer: Printer = PrivateAttr(default_factory=Printer)

    def log(self, level, message, color="bold_yellow"):
        if self.verbose:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self._printer.print(
                f"\n[{timestamp}][{level.upper()}]: {message}", color=color
            )


class FileLogger():
    def __init__(self, filepath: Path, verbose_level=0):
        self._filepath = filepath
        self.verbose_level = verbose_level
        
    def log(self, level, message):
        level_map = {"debug": 1, "info": 2}
        if self.verbose_level and level_map.get(level, 0) <= self.verbose_level:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            text = f"[{timestamp}][{level.upper()}]: {message}"

            with open(self._filepath, "a") as f:
                f.write(text+"\n")
