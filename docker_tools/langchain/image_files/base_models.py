from typing import Any
from pydantic import BaseModel


class Callable(BaseModel):
    module_path: str
    class_name: str
    args: list[Any] | None = None
    kwargs: dict[str, Any] | None = None


class ImportToolData(BaseModel):
    callable: Callable
    dependencies: list[str] | None = None
    force_build: bool = False


class RunToolModel(BaseModel):
    run_params_txt: str