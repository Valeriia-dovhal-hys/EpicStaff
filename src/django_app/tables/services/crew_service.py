from django.forms.models import model_to_dict
from rest_framework.utils.serializer_helpers import ReturnDict
from tables.request_models import *
from tables.request_models import CrewData
from utils.singleton_meta import SingletonMeta
from tables.models import *
from tables.serializers.nested_model_serializers import (
    NestedCrewSerializer,
    NestedTaskSerializer,
)
import json
from django.db.models import QuerySet


class CrewService(metaclass=SingletonMeta):

    def __init__(self): ...

    def inject_tasks(self, crew_data: dict) -> dict:

        tasks = Task.objects.filter(crew=crew_data["id"])
        task_list = NestedTaskSerializer(tasks, many=True).data

        crew_data["tasks"] = task_list

        return crew_data

    def convert_crew_to_pydantic(self, crew_id: int) -> CrewData:
        crew = Crew.objects.get(pk=crew_id)

        agents_data = [
            self.convert_agent_to_pydantic(agent) for agent in crew.agents.all()
        ]

        manager_llm = self.convert_llm_to_pydantic(
            crew.manager_llm_model, crew.manager_llm_config
        )
        embedder = self.convert_embedder_to_pydantic(crew.embedding_model)

        crew_data = CrewData(
            id=crew.pk,
            name=crew.name,
            assignment=crew.assignment or "",
            agents=agents_data,
            process=crew.process,
            memory=crew.memory,
            manager_llm=manager_llm,
            embedder=embedder,
        )

        return crew_data

    def convert_agent_to_pydantic(self, agent: Agent) -> AgentData:
        tools_data = [self.convert_tool_to_pydantic(tool) for tool in agent.tools.all()]

        llm = self.convert_llm_to_pydantic(agent.llm_model, agent.llm_config)
        function_calling_llm = self.convert_llm_to_pydantic(
            agent.fcm_llm_model, agent.fcm_llm_config
        )

        return AgentData(
            role=agent.role,
            goal=agent.goal,
            backstory=agent.backstory,
            tools=tools_data,
            allow_delegation=agent.allow_delegation,
            memory=agent.memory,
            max_iter=agent.max_iter,
            llm=llm,
            function_calling_llm=function_calling_llm,
        )

    def convert_tool_to_pydantic(self, tool: Tool) -> ToolData:
        tool_config = ToolConfig(
            llm=(
                self.convert_llm_to_pydantic(tool.llm_model, tool.llm_config)
                if tool.requires_model
                else None
            ),
            embedder=(
                self.convert_embedder_to_pydantic(tool.embedding_model)
                if tool.requires_model
                else None
            ),
        )

        return ToolData(
            name_alias=tool.name_alias,
            requires_model=tool.requires_model,
            tool_config=tool_config,
        )

    def convert_llm_to_pydantic(
        self, model: LLMModel, config: ConfigLLM
    ) -> LLMData | None:
        if not model:
            return None

        return LLMData(
            provider=model.llm_provider.name,
            config=LLMConfig(
                model=model.name, temperature=config.temperature if config else None
            ),
        )

    def convert_embedder_to_pydantic(
        self, embedding_model: EmbeddingModel
    ) -> EmbedderData | None:
        if not embedding_model:
            return None

        return EmbedderData(
            provider=(
                embedding_model.embedding_provider.name
                if embedding_model.embedding_provider
                else None
            ),
            config=EmbedderConfig(
                model=embedding_model.name, base_url=embedding_model.base_url
            ),
        )
