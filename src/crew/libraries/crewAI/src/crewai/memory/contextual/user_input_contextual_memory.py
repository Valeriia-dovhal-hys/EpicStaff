from typing import Any, Dict, Optional

from crewai.memory import UserMemory


class UserInputContextualMemory:
    def __init__(
        self,
        memory_config: Optional[Dict[str, Any]],
        um: UserMemory,
    ):
        if memory_config is not None:
            self.memory_provider = memory_config.get("provider")
        else:
            self.memory_provider = None
        self.um = um

    def _fetch_user_context(
        self, query: str, limit: int = 5, score_threshold: float = 0.45
    ) -> str:
        """
        Fetches and formats relevant user information from User Memory.
        Args:
            query (str): The search query to find relevant user memories.
        Returns:
            str: Formatted user memories as bullet points, or an empty string if none found.
        """
        user_memories = self.um.search(
            query=query, limit=limit, score_threshold=score_threshold
        )
        if not user_memories:
            return ""

        formatted_memories = "\n".join(
            f"- {result['memory']}" for result in user_memories
        )
        return f"User memories/preferences:\n{formatted_memories}"
