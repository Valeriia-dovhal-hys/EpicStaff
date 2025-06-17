from crewai.memory.entity.entity_memory_item import EntityMemoryItem
from crewai.memory.memory import Memory
from crewai.memory.storage.rag_storage import RAGStorage


class EntityMemory(Memory):
    """
    EntityMemory class for managing structured information about entities
    and their relationships using SQLite storage.
    Inherits from the Memory class.
    """

    def __init__(self, crew=None, embedder_config=None, storage=None, path=None):
        if hasattr(crew, "memory_config") and crew.memory_config is not None:
            self.memory_provider = crew.memory_config.get("provider")
        else:
            self.memory_provider = None

        if self.memory_provider == "local_mem0":
            try:
                from crewai.memory.storage.local_mem0_storage import LocalMem0Storage
            except Exception:
                raise ImportError(
                    f"Error in {__class__.__name__} while importing: LocalMem0Storage. 'from crewai.memory.storage.local_mem0_storage import LocalMem0Storage'"
                )
            storage = LocalMem0Storage(type="entities", crew=crew)

        elif self.memory_provider == "mem0":
            try:
                from crewai.memory.storage.mem0_storage import Mem0Storage
            except ImportError:
                raise ImportError(
                    "Mem0 is not installed. Please install it with `pip install mem0ai`."
                )
            storage = Mem0Storage(type="entities", crew=crew)
        else:
            storage = (
                storage
                if storage
                else RAGStorage(
                    type="entities",
                    allow_reset=True,
                    embedder_config=embedder_config,
                    crew=crew,
                    path=path,
                )
            )
        super().__init__(storage)

    def save(self, batch_of_items: list[EntityMemoryItem]) -> None:  # type: ignore # BUG?: Signature of "save" incompatible with supertype "Memory"

        if self.memory_provider == "local_mem0":
            data = ""
            for item in batch_of_items:
                data += f"{item.name}({item.type}): {item.description}\n "
            super().save(data, item.metadata)

        elif self.memory_provider == "mem0":
            for item in batch_of_items:
                data = f"""
                Remember details about the following entity:
                Name: {item.name}
                Type: {item.type}
                Entity Description: {item.description}
                """
                super().save(data, item.metadata)
        else:
            for item in batch_of_items:
                data = f"{item.name}({item.type}): {item.description}"
                super().save(data, item.metadata)

    def reset(self) -> None:
        try:
            self.storage.reset()
        except Exception as e:
            raise Exception(f"An error occurred while resetting the entity memory: {e}")
