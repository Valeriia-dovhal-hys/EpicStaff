from pydantic import BaseModel


class RunCrewModel(BaseModel):
    crew_id: int
