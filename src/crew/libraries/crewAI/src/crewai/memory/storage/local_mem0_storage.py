import os
from typing import Any, Dict, List
from mem0 import Memory
from crewai.memory.storage.interface import Storage


class LocalMem0Storage(Storage):
    """
    Extends Storage to handle embedding and searching across entities using mem0.Memory.
    """

    def __init__(self, type, crew=None):
        super().__init__()

        if type not in ["user", "short_term", "long_term", "entities"]:
            raise ValueError("Invalid type for LocalMem0Storage.")

        self.memory_type = type
        self.crew = crew
        self.memory_config = crew.memory_config

        # User ID is required for user memory type "user" since it's used as a unique identifier for the user.
        user_id = self._get_user_id()
        if not user_id:
            raise ValueError("User ID is required in `memory_config` for `local_mem0`")

        # API key in memory config overrides the environment variable
        db_config = self.memory_config.get("db_config", {})

        if db_config:
            self.memory = Memory.from_config(config_dict=db_config)
        else:
            raise AttributeError('Can not fetch "db_config" from Crew.memory_config')

    def _sanitize_role(self, role: str) -> str:
        """
        Sanitizes agent roles to ensure valid directory names.
        """
        return role.replace("\n", "").replace(" ", "_").replace("/", "_")

    def save(self, value: Any, metadata: Dict[str, Any]) -> None:
        user_id = self._get_user_id()
        agent_name = self._get_agent_name()
        run_id = self._get_run_id()

        if self.memory_type == "user":
            self.memory.add(
                value,
                user_id=user_id,
                run_id=run_id,
                metadata={"type": "user", **metadata},
                search_limit=5,
            )

        elif self.memory_type == "short_term":
            self.memory.add(
                value,
                user_id=user_id,
                run_id=run_id,
                agent_id=agent_name,
                metadata={"type": "short_term", **metadata},
                search_limit=3,
            )

        elif self.memory_type == "long_term":
            # TODO: Come up with implementation of mem0.MemoryClient(..., infer=True, ...) parameter via mem0.Memory
            self.memory.add(
                value,
                user_id=user_id,
                run_id=run_id,
                agent_id=agent_name,
                metadata={"type": "long_term", **metadata},
                search_limit=5,
            )

        elif self.memory_type == "entities":
            self.memory.add(
                value,
                user_id=user_id,
                run_id=run_id,
                agent_id=agent_name,
                metadata={"type": "entity", **metadata},
                search_limit=2,
            )

    def search(
        self,
        query: str,
        limit: int = 3,
        score_threshold: float = 0.45,
    ) -> List[Any]:

        # Note: changed params according new save() method parameters
        params = {"query": query, "limit": limit}
        user_id = self._get_user_id()
        run_id = self._get_run_id()
        # pass metadata as params["filters"]
        if self.memory_type == "user":
            params["user_id"] = user_id
            params["run_id"] = run_id
            params["filters"] = {"type": "user"}

        elif self.memory_type == "short_term":
            agent_name = self._get_agent_name()
            params["user_id"] = user_id
            params["agent_id"] = agent_name
            params["run_id"] = run_id
            params["filters"] = {"type": "short_term"}

        elif self.memory_type == "long_term":
            agent_name = self._get_agent_name()
            params["user_id"] = user_id
            params["agent_id"] = agent_name
            params["run_id"] = run_id
            params["filters"] = {"type": "long_term"}

        elif self.memory_type == "entities":
            agent_name = self._get_agent_name()
            params["user_id"] = user_id
            params["agent_id"] = agent_name
            params["run_id"] = run_id
            params["filters"] = {"type": "entity"}

        results = self.memory.search(**params)
        return [r for r in results if r["score"] <= score_threshold]

    def _get_user_id(self):
        if self.memory_type:
            if hasattr(self, "memory_config") and self.memory_config is not None:
                return self.memory_config.get("config", {}).get("user_id")
            else:
                return None
        return None

    def _get_agent_name(self):
        agents = self.crew.agents if self.crew else []
        agents = [self._sanitize_role(agent.role) for agent in agents]
        agents = "_".join(agents)
        return agents

    def _get_run_id(self):
        if self.memory_type:
            if hasattr(self, "memory_config") and self.memory_config is not None:
                return self.memory_config.get("config", {}).get("run_id")
            else:
                return None
        return None
