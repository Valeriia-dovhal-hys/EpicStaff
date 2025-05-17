from typing import Any
from pydantic import BaseModel


class RunCrewModel(BaseModel):
    data: dict[str, Any]
