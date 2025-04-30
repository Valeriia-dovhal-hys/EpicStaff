from abc import ABC
from datetime import datetime
from pathlib import Path

from crewai.utilities.printer import Printer


class AbstractLogger(ABC):
    def __init__(self, verbose_level=0):
        verbose_level = (
            2 if isinstance(verbose_level, bool) and verbose_level else verbose_level
        )
        self.verbose_level = verbose_level


class Logger(AbstractLogger):
    _printer = Printer()

    def __init__(self, verbose_level=0):
        super().__init__(verbose_level)

    def log(self, level, message, color="bold_green"):
        level_map = {"debug": 1, "info": 2}
        if self.verbose_level and level_map.get(level, 0) <= self.verbose_level:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            self._printer.print(
                f"[{timestamp}][{level.upper()}]: {message}", color=color
            )


class FileLogger(AbstractLogger):
    def __init__(self, filepath: Path, verbose_level=0):
        super().__init__(verbose_level)
        self._filepath = filepath

    def log(self, level, message):
        level_map = {"debug": 1, "info": 2}
        if self.verbose_level and level_map.get(level, 0) <= self.verbose_level:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            text = f"[{timestamp}][{level.upper()}]: {message}"
            # todo refactor
            with open(self._filepath, "a") as f:
                f.write(text+"\n")
