from typing import Any, Dict, Optional

from crewai.memory import EntityMemory, LongTermMemory, ShortTermMemory, UserMemory


class ContextualMemory:
    def __init__(
        self,
        memory_config: Optional[Dict[str, Any]],
        stm: ShortTermMemory,
        ltm: LongTermMemory,
        em: EntityMemory,
        um: UserMemory,
    ):
        if memory_config is not None:
            self.memory_provider = memory_config.get("provider")
        else:
            self.memory_provider = None
        self.stm = stm
        self.ltm = ltm
        self.em = em
        self.um = um

    def build_context_for_task(self, task, context) -> str:
        """
        Automatically builds a minimal, highly relevant set of contextual information
        for a given task.
        """
        query = f"{task.description} {context}".strip()

        if query == "":
            return ""

        context = []
        context.append(self._fetch_ltm_context(task.description))
        context.append(self._fetch_stm_context(query))
        context.append(self._fetch_entity_context(query))
        context.append(
            self._fetch_user_context(query=query, limit=8, score_threshold=0.75)
        )
        return "\n".join(filter(None, context))

    def _fetch_stm_context(self, query) -> str:
        """
        Fetches recent relevant insights from STM related to the task's description and expected_output,
        formatted as bullet points.
        """
        stm_results = self.stm.search(query)
        formatted_results = "\n".join(
            [
                f"- {result['memory'] if self.memory_provider == 'mem0' or self.memory_provider == 'local_mem0' else result['context']}"
                for result in stm_results
            ]
        )
        return (
            f"Short-term memories. Recent Insights:\n{formatted_results}"
            if stm_results
            else ""
        )

    def _fetch_ltm_context(self, task) -> Optional[str]:
        """
        Fetches historical data or insights from LTM that are relevant to the task's description and expected_output,
        formatted as bullet points.
        """
        ltm_results = self.ltm.search(task, latest_n=2)
        if not ltm_results:
            return None

        formatted_results = [
            suggestion
            for result in ltm_results
            for suggestion in result["metadata"]["suggestions"]  # type: ignore # Invalid index type "str" for "str"; expected type "SupportsIndex | slice"
        ]
        formatted_results = list(dict.fromkeys(formatted_results))
        formatted_results = "\n".join([f"- {result}" for result in formatted_results])  # type: ignore # Incompatible types in assignment (expression has type "str", variable has type "list[str]")

        return (
            f"Long-term memories. Historical Data:\n{formatted_results}"
            if ltm_results
            else ""
        )

    def _fetch_entity_context(self, query) -> str:
        """
        Fetches relevant entity information from Entity Memory related to the task's description and expected_output,
        formatted as bullet points.
        """
        em_results = self.em.search(query)
        formatted_results = "\n".join(
            [
                f"- {result['memory'] if self.memory_provider == 'mem0' or  self.memory_provider == 'local_mem0' else result['context']}"
                for result in em_results
            ]  # type: ignore #  Invalid index type "str" for "str"; expected type "SupportsIndex | slice"
        )
        return f"Entity memories:\n{formatted_results}" if em_results else ""

    def _fetch_user_context(
        self, query: str, limit: int, score_threshold: float
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
        return f"User memories take priority over all other memory types. If any conflicting or unclear information appears, always trust and follow the details from user memories/preferences as the most accurate source. User memories/preferences:\n{formatted_memories}"
