from typing import Any, Dict, Optional

from crewai.memory.memory import Memory


class UserMemory(Memory):
    """
    UserMemory class for handling user memory storage and retrieval.
    Inherits from the Memory class and utilizes an instance of a class that
    adheres to the Storage for data storage, specifically working with
    MemoryItem instances.
    """

    def __init__(self, crew=None, embedder_config=None):
        self.memory_provider = crew.memory_config.get("provider")

        if self.memory_provider == "local_mem0":
            try:
                from crewai.memory.storage.local_mem0_storage import LocalMem0Storage
            except Exception:
                raise ImportError(
                    f"Error in {__class__.__name__} while importing: LocalMem0Storage. 'from crewai.memory.storage.local_mem0_storage import LocalMem0Storage'"
                )
            storage = LocalMem0Storage(type="user", crew=crew)

        elif self.memory_provider == "mem0":
            try:
                from crewai.memory.storage.mem0_storage import Mem0Storage
            except ImportError:
                raise ImportError(
                    "Mem0 is not installed. Please install it with `pip install mem0ai`."
                )
            storage = Mem0Storage(type="user", crew=crew)

        else:
            raise AttributeError(
                "UserMemory available only for memory provider: `local_mem0` or `mem0`"
            )

        super().__init__(storage)

    def save(
        self,
        value,
        metadata: Optional[Dict[str, Any]] = None,
        agent: Optional[str] = None,
    ) -> None:
        data = f"Remember the details about the user: {value}"
        super().save(data, metadata)

    def search(
        self,
        query: str,
        limit: int = 3,
        score_threshold: float = 0.35,
    ):
        results = self.storage.search(
            query=query,
            limit=limit,
            score_threshold=score_threshold,
        )
        return results
