from typing import Any, Union
import typing
from pydantic import BaseModel

class RunToolParamsModel(BaseModel):
    tool_config: dict[str, Any] | None = None
    run_args: list[str]
    run_kwargs: dict[str, Any]


class ClassDataResponseModel(BaseModel):
    classdata: str


class RunToolResponseModel(BaseModel):
    data: str