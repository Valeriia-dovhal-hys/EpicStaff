import os
from textwrap import dedent
from crewai import Agent, Crew, Task, LLM
from langchain_core.tools import BaseTool


from models.request_models import (
    LLMData,
    AgentData,
    CrewData,
    TaskData,
)
from services.proxy_tool_factory import ProxyToolFactory

class CrewParser:

    def __init__(self, manager_host="manager_container", manager_port=8000):
        self.proxy_tool_factory = ProxyToolFactory(host=manager_host, port=manager_port)

    def parse_llm(self, llm: LLMData):
        llm_config = {"provider": llm.provider, **llm.config.model_dump()}
    
        return LLM(**llm_config)

    def parse_agent(self, agent_data: AgentData) -> Agent:

        role = agent_data.role
        goal = agent_data.goal
        backstory = agent_data.backstory

        llm = None
        if agent_data.llm is not None:
            llm = self.parse_llm(agent_data.llm)
        
        tool_list: list[BaseTool] = []
        if agent_data.tools is not None:
            for tool_data in agent_data.tools:
                tool_list.append(self.proxy_tool_factory.create_proxy_class(tool_data=tool_data)())


        function_calling_llm = None
        if agent_data.function_calling_llm is not None:
            function_calling_llm = self.parse_llm(agent_data.function_calling_llm)


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

        embedder = crew_data.embedder
        if embedder is not None:
            crew_config["embedder"] = embedder.model_dump(exclude_none=True)

        manager_llm = self.parse_llm(
            llm=crew_data.manager_llm
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
