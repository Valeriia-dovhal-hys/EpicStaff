from typing import Any, Dict, List

from crewai.memory.long_term.long_term_memory_item import LongTermMemoryItem
from crewai.memory.long_term.long_term_memory import LongTermMemory
from crewai.memory.memory import Memory
from crewai.memory.storage.ltm_sqlite_storage import LTMSQLiteStorage


class LocalLongTermMemory(Memory):
    """
    Override LongTermMemory for enabling storing data with `local_mem0`
    Usage: Crew.create_crew_memory()
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
            storage = LocalMem0Storage(type="long_term", crew=crew)

        else:
            raise AttributeError(
                'LocalLongTermMemory available only for memory provider: "local_mem0"'
            )

        super().__init__(storage)

    def save(self, item: LongTermMemoryItem) -> None:
        metadata = item.metadata
        metadata.update({"agent": item.agent, "expected_output": item.expected_output})
        self.storage.save(value=item.task, metadata=metadata)

    def search(self, task: str, latest_n: int = 3) -> List[Dict[str, Any]]:
        return self.storage.search(query=task, limit=latest_n)

    def reset(self) -> None:
        self.storage.reset()
