from typing import Any
from enum import Enum
from pydantic import BaseModel


class SessionStatus(Enum):
        END = "end"
        RUN = "run"
        WAIT_FOR_USER = "wait_for_user"
        ERROR = "error"


class RunToolParamsModel(BaseModel):
    run_args: list[str]
    run_kwargs: dict[str, Any]


class RunCrewModel(BaseModel):
    data: dict[str, Any]


class ToolListResponseModel(BaseModel):
    tool_list: list[str]

class ClassDataResponseModel(BaseModel):
    classdata: str


class RunToolResponseModel(BaseModel):
    data: str


class RunCrewResponseModel(BaseModel):
    data: str
