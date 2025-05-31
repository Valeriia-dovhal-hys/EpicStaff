from typing import Any
from pydantic import BaseModel


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
