import json
import os
from textwrap import dedent
from typing import Any

from crewai import Agent, Crew, Task
from langchain_core.tools import BaseTool


from src.fastapi.services.proxy_tool_factory import ProxyToolFactory
from src.utils import get_llm


class CrewParser:

    def __init__(
        self, tool_registry_host="tool_registry_container", tool_registry_port=8000
    ):
        self.proxy_tool_factory = ProxyToolFactory(
            host=tool_registry_host, port=tool_registry_port
        )

    def parse_llm(self, llm_data: dict, llm_config_data: dict):
        model_name = llm_data["name"]
        provider = llm_data["llm_provider"]["name"]
        temperature = llm_config_data["temperature"]
        num_ctx = llm_config_data["num_ctx"]
        base_url = llm_data["base_url"]
        deployment = llm_data["deployment"]

        return get_llm(
            model_name=model_name,
            temperature=temperature,
            num_ctx=num_ctx,
            provider=provider,
            base_url=base_url,
            deployment=deployment,
        )

    def parse_tool(self, tool_data: dict) -> BaseTool:
        tool_alias: str = tool_data["name"]
        tool_config = dict()

        llm_data = tool_data["llm_model"]
        llm_config_data = tool_data["llm_config"]
        if llm_data is not None and llm_config_data is not None:
            tool_config["llm"] = self.parse_llm(
                llm_data=llm_data, llm_config_data=llm_config_data
            )

        embedding_data = tool_data["embedding_model"]

        if embedding_data is not None:
            tool_config["embedder"] = self.parse_embedder(
                embedding_model_data=embedding_data
            )

        proxy_tool_class = self.proxy_tool_factory.create_proxy_class(
            tool_alias, tool_config=tool_config
        )

        return proxy_tool_class()

    def parse_manager_llm(self, manager_llm_data: dict) -> dict | None:

        llm_data = manager_llm_data["llm_model"]
        llm_config_data = manager_llm_data["llm_config"]

        if llm_data is None or llm_config_data is None:
            return None
        return self.parse_llm(llm_data=llm_data, llm_config_data=llm_config_data)

    def parse_embedder(self, embedding_model_data: dict) -> dict | None:

        if embedding_model_data is None or embedding_model_data["name"] is None:
            return None

        model = embedding_model_data["name"]
        deployment_name = embedding_model_data["deployment"]
        provider = embedding_model_data["embedding_provider"]["name"]
        base_url = embedding_model_data["base_url"]

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

    def parse_agent(self, agent_data: dict) -> Agent:

        role = agent_data["role"]
        goal = agent_data["goal"]
        backstory = agent_data["backstory"]

        llm_data = agent_data.get("llm_model", None)
        llm_config_data = agent_data.get("llm_config", None)
        llm = None
        if llm_data:
            llm = self.parse_llm(llm_data=llm_data, llm_config_data=llm_config_data)

        tool_data_list = agent_data.get("tools", None)
        tool_list: list[BaseTool] = []
        if tool_data_list:
            for tool_data in tool_data_list:
                tool_list.append(self.parse_tool(tool_data))

        function_calling_llm = agent_data.get("fcm_llm_model", None)
        function_calling_llm_config_data = agent_data.get("fcm_llm_config", None)
        function_calling_llm = None
        if function_calling_llm and function_calling_llm_config_data:
            function_calling_llm = self.parse_llm(
                llm_model_data=function_calling_llm,
                llm_config=function_calling_llm_config_data,
            )

        allow_delegation = agent_data.get("allow_delegation", None)
        memory = agent_data.get("memory", None)
        max_iter = agent_data.get("memory", None)

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

    def parse_task(self, task_data, assignment) -> Task:
        description = task_data["instructions"].replace("{assignment}", assignment)
        agent = self.parse_agent(task_data["agent"])

        return Task(
            description=dedent(description),
            agent=agent,
            expected_output=task_data("Expected Output"),
        )

    def parse_crew(self, crew_data: dict) -> Crew:

        crew_config = {
            "verbose": True,
        }

        assignment = crew_data["assignment"]

        crew_config["process"] = crew_data["process"]
        crew_config["memory"] = crew_data["memory"]

        agent_data_list: list[dict] = crew_data.get("agents", [])
        crew_config["agents"] = [
            self.parse_agent(agent_data) for agent_data in agent_data_list
        ]

        embedder = self.parse_embedder(crew_data.get("embedding_model", None))
        if embedder is not None:
            crew_config["embedder"] = embedder

        manager_llm = self.parse_manager_llm(crew_data["manager_llm"])
        if manager_llm is not None:
            crew_config["manager_llm"] = manager_llm

        task_list_data: list[dict] = crew_data["task_list"]
        task_list_data.sort(key=lambda item: int(item["order"]))

        crew_config["tasks"] = [
            self.parse_task(task_data, assignment) for task_data in task_list_data
        ]

        return Crew(config=crew_config)
