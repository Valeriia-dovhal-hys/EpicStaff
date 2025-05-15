import json
from textwrap import dedent
from typing import Any

from crewai import Agent, Crew, Task
from langchain_core.tools import BaseTool


def parse_tool(tool_data: dict) -> BaseTool:

    # TODO: CREATE PROXY TOOL HERE
    pass


def parse_llm(llm_data: dict, llm_config: dict):
    # TODO: Create LLM object from this data
    pass


def parse_embedding_model(embedding_model: dict):
    pass


def parse_agent(agent_data: dict) -> Agent:

    role = agent_data["role"]
    goal = agent_data["goal"]
    backstory = agent_data["backstory"]

    llm_data = agent_data.get("llm_model", None)
    llm_config_data = agent_data.get("llm_model_config", None)
    llm = None
    if llm_data:
        llm = parse_llm(llm_data=llm_data, llm_config=llm_config_data)

    tool_data_list = agent_data.get("tools", None)
    tool_list: list[BaseTool] = []
    if tool_data_list:
        for tool_data in tool_data_list:
            tool_list.append(parse_tool(tool_data))

    function_calling_llm = agent_data.get("fcm_llm_model", None)
    function_calling_llm_config_data = agent_data.get("fcm_llm_config", None)
    function_calling_llm = None
    if function_calling_llm and function_calling_llm_config_data:
        function_calling_llm = parse_llm(
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


def get_agent_by_role(agents, desired_role):
    return next((agent for agent in agents if agent.role == desired_role), None)


def parse_task(task_data, assignment, created_agents, **kwargs) -> Task:
    description = task_data["instructions"].replace("{assignment}", assignment)
    desired_role = row["Agent"]

    return Task(
        description=dedent(description),
        expected_output=row["Expected Output"],
        agent=get_agent_by_role(created_agents, desired_role),
    )


def parse_crew(crew_data: dict) -> Crew:
    assignment = crew_data["assignment"]
    process = crew_data["process"]
    verbose = True
    memory = crew_data["memory"]

    agent_data_list: list[dict] = crew_data.get("agents", [])
    agents = [parse_agent(agent_data) for agent_data in agent_data_list]

    embedding_model = parse_embedding_model(crew_data["embedding_model"])

    return Crew(
        agents=agents,
        # tasks=created_tasks,
        verbose=verbose,
        process=process,
        memory=memory,
        # manager_llm=manager_llm,
        # embedder={"provider": provider, "config": embedder_config},
    )
