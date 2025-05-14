from typing import Any
from pydantic import BaseModel


class RunToolParamsModel(BaseModel):
    run_args: list[str]
    run_kwargs: dict[str, Any]
