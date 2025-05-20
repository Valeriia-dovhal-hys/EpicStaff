import json
import os
from textwrap import dedent
from typing import Any

from crewai import Agent, Crew, Task

from langchain_core.tools import BaseTool


from fastapi_app.models.request_models import (
    AgentData,
    ConfigLLMData,
    CrewData,
    EmbeddingModelData,
    LLMModelData,
    TaskData,
    ToolData,
)
from fastapi_app.services.proxy_tool_factory import ProxyToolFactory
from utils import get_llm


class CrewParser:

    def __init__(
        self, tool_registry_host="tools_registry_container", tool_registry_port=8000
    ):
        self.proxy_tool_factory = ProxyToolFactory(
            host=tool_registry_host, port=tool_registry_port
        )

    def parse_llm(self, llm_data: LLMModelData, llm_config_data: ConfigLLMData):

        return get_llm(
            model_name=llm_data.name,
            temperature=llm_config_data.temperature,
            num_ctx=llm_config_data.num_ctx,
            provider=llm_data.llm_provider.name,
            base_url=llm_data.base_url,
            deployment=llm_data.deployment,
        )

    def parse_tool(self, tool_data: ToolData) -> BaseTool:
        tool_alias: str = tool_data.name
        tool_config = dict()

        llm_data = tool_data.llm_model
        llm_config_data = tool_data.llm_config
        if llm_data is not None and llm_config_data is not None:
            tool_config["llm"] = self.parse_llm(
                llm_data=llm_data, llm_config_data=llm_config_data
            )

        embedding_data = tool_data.embedding_model

        if embedding_data is not None:
            tool_config["embedder"] = self.parse_embedder(
                embedding_model_data=embedding_data
            )

        proxy_tool_class = self.proxy_tool_factory.create_proxy_class(
            tool_alias, tool_config=tool_config
        )

        return proxy_tool_class()

    def parse_embedder(self, embedding_model_data: EmbeddingModelData) -> dict | None:

        if embedding_model_data is None or embedding_model_data.name is None:
            return None

        model = embedding_model_data.name
        deployment_name = embedding_model_data.deployment
        provider = embedding_model_data.embedding_provider.name
        base_url = embedding_model_data.base_url

        embedder_config = {
            "model": model,
        }

        if provider == "azure-openai":
            embedder_config["deployment_name"] = (
                deployment_name  # Set azure specific config
            )
            # os.environ["AZURE_OPENAI_DEPLOYMENT"] = deployment_name #Wrokarond since azure
            os.environ["OPENAI_API_KEY"] = os.environ["AZURE_OPENAI_KEY"]
        elif provider == "openai":
            embedder_config["api_key"] = os.environ.get("SECRET_OPENAI_API_KEY")
            os.environ["OPENAI_BASE_URL"] = "https://api.openai.com/v1"
        elif provider == "ollama":
            if base_url is not None:
                embedder_config["base_url"] = base_url
        else:  # Any other openai compatible e.g. ollama or llama-cpp
            provider = "openai"
            api_key = "NA"
            embedder_config["base_url"] = base_url
            embedder_config["api_key"] = api_key

        return {"provider": provider, "config": embedder_config}

        # Groq doesn't have an embedder

    def parse_agent(self, agent_data: AgentData) -> Agent:

        role = agent_data.role
        goal = agent_data.goal
        backstory = agent_data.backstory

        llm_data = agent_data.llm_model
        llm_config_data = agent_data.llm_config
        llm = None
        if llm_data is not None and llm_config_data is not None:
            llm = self.parse_llm(llm_data=llm_data, llm_config_data=llm_config_data)

        tool_data_list = agent_data.tools
        tool_list: list[BaseTool] = []
        if tool_data_list is not None:
            for tool_data in tool_data_list:
                tool_list.append(self.parse_tool(tool_data))

        function_calling_llm = agent_data.fcm_llm_model
        function_calling_llm_config_data = agent_data.fcm_llm_config
        function_calling_llm = None
        if function_calling_llm and function_calling_llm_config_data:
            function_calling_llm = self.parse_llm(
                llm_model_data=function_calling_llm,
                llm_config=function_calling_llm_config_data,
            )

        allow_delegation = agent_data.allow_delegation
        memory = agent_data.memory
        max_iter = agent_data.max_iter

        agent_config = {
            "role": role,
            "goal": goal,
            "backstory": backstory,
            "allow_delegation": allow_delegation,
            "verbose": True,
            "tools": tool_list,
            "memory": memory,
            "max_iter": max_iter,
            "llm": llm,
            "function_calling_llm": function_calling_llm,
        }

        return Agent(config=agent_config)

    def parse_task(
        self, task_data: TaskData, assignment: str, agents: list[Agent]
    ) -> Task:
        description = task_data.instructions.replace("{assignment}", assignment)
        agent = None
        for a in agents:
            if task_data.agent.role == a.role:
                agent = a
                break

        return Task(
            description=dedent(description),
            agent=agent,
            expected_output=task_data.expected_output,
        )

    def parse_crew(self, crew_data: CrewData) -> Crew:

        crew_config = {
            "verbose": True,
        }

        assignment = crew_data.assignment

        crew_config["process"] = crew_data.process
        crew_config["memory"] = crew_data.memory

        agent_data_list: list[AgentData] = crew_data.agents
        crew_config["agents"] = [
            self.parse_agent(agent_data) for agent_data in agent_data_list
        ]

        embedder = self.parse_embedder(crew_data.embedding_model)
        if embedder is not None:
            crew_config["embedder"] = embedder

        manager_llm = self.parse_llm(
            llm_data=crew_data.manager_llm_model,
            llm_config_data=crew_data.manager_llm_config,
        )

        if manager_llm is not None:
            crew_config["manager_llm"] = manager_llm

        task_list_data: list[TaskData] = crew_data.tasks
        task_list_data.sort(key=lambda item: int(item.order))

        crew_config["tasks"] = [
            self.parse_task(task_data, assignment, agents=crew_config["agents"])
            for task_data in task_list_data
        ]

        return Crew(**crew_config)
