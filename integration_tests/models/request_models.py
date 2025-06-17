from pydantic import BaseModel


class KnowledgeSearchMessage(BaseModel):
    collection_id: int
    uuid: str
    query: str
    search_limit: int | None
    distance_threshold: float | None
