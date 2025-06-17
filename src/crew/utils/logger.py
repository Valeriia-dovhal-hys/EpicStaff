from types import TracebackType
from typing import Type
from loguru import logger
import sys
import traceback

logger.remove()
logger.add(sys.stdout, format="{time} {level} {message}", level="INFO")
logger.add("logs/file.log", rotation="1 MB", compression="zip")


def log_exception(
    exc_type: Type[BaseException],
    exc_value: BaseException,
    exc_traceback: TracebackType,
):
    # todo: send error to redis
    formatted_traceback = "".join(
        traceback.format_exception(exc_type, exc_value, exc_traceback)
    )

    logger.exception(
        f"Uncaught exception\n{formatted_traceback}",
        exc_info=(exc_type, exc_value, exc_traceback),
    )


sys.excepthook = log_exception
