import os
from textwrap import dedent
from typing import Any
from crewai import Agent, Crew, Task, LLM
from langchain_core.tools import BaseTool
from utils import parse_llm
from callbacks.session_callback_factory import CrewCallbackFactory
from services.schema_converter.converter import generate_model_from_schema
from services.python_code_executor_service import RunPythonCodeService
from services.knowledge_search_service import KnowledgeSearchService
from utils.singleton_meta import SingletonMeta
from services.redis_service import RedisService
from models.request_models import (
    AgentData,
    CrewData,
    TaskData,
)

from settings import PGVECTOR_MEMORY_CONFIG
import copy
from services.crew.proxy_tool_factory import ProxyToolFactory


class CrewParserService(metaclass=SingletonMeta):

    def __init__(
        self,
        manager_host: str,
        manager_port: int,
        redis_service: RedisService,
        python_code_executor_service: RunPythonCodeService,
        knowledge_search_service: KnowledgeSearchService,
    ):
        self.redis_service = redis_service

        self.proxy_tool_factory = ProxyToolFactory(
            host=manager_host,
            port=manager_port,
            redis_service=redis_service,
            python_code_executor_service=python_code_executor_service,
        )
        self.knowledge_search_service = knowledge_search_service

    def parse_agent(
        self,
        agent_data: AgentData,
        step_callback: Any,
        wait_for_user_callback: Any,
        inputs: dict[str, Any],
        tool_list: list[BaseTool] | None = None,
    ) -> Agent:

        llm = None
        if agent_data.llm is not None:
            llm = parse_llm(agent_data.llm)

        if tool_list is None:
            tool_list = []

        function_calling_llm = None
        if agent_data.function_calling_llm is not None:
            function_calling_llm = parse_llm(agent_data.function_calling_llm)

        agent_config = {
            "role": agent_data.role,
            "goal": agent_data.goal,
            "backstory": agent_data.backstory,
            "allow_delegation": agent_data.allow_delegation,
            "verbose": True,
            "tools": tool_list,
            "memory": agent_data.memory,
            "max_iter": agent_data.max_iter,
            "max_rpm": agent_data.max_rpm,
            "max_execution_time": agent_data.max_execution_time,
            "cache": agent_data.cache,
            "max_retry_limit": agent_data.max_retry_limit,
            "llm": llm,
            "function_calling_llm": function_calling_llm,
            "ask_human_input_callback": wait_for_user_callback,
            "step_callback": step_callback,
            "knowledge_collection_id": agent_data.knowledge_collection_id,
            "search_knowledges": self.knowledge_search_service.search_knowledges,
        }

        return Agent(config=agent_config)

    def parse_task(
        self,
        task_data: TaskData,
        agent: Agent,
        task_callback: Any,
        context_tasks: list[Task],
    ) -> Task:
        output_model = None
        if task_data.output_model is not None:
            output_model = generate_model_from_schema(task_data.output_model)
        return Task(
            name=task_data.name,
            description=task_data.instructions,
            agent=agent,
            expected_output=task_data.expected_output,
            human_input=task_data.human_input,
            callback=task_callback,
            async_execution=task_data.async_execution,
            config=task_data.config,
            output_pydantic=output_model,
            context=context_tasks,
        )

    def parse_crew(
        self,
        crew_data: CrewData,
        session_id: int,
        crew_callback_factory: CrewCallbackFactory,
        inputs: dict[str, Any] | None = None,
        global_kwargs: dict[str, Any] | None = None,
    ) -> Crew:
        if inputs is None:
            inputs = {}
        if global_kwargs is None:
            global_kwargs = {}

        crew_config = {
            "verbose": True,
            "process": crew_data.process,
            "memory": crew_data.memory,
            "config": crew_data.config,
            "max_rpm": crew_data.max_rpm,
            "cache": crew_data.cache,
            "full_output": crew_data.full_output,
            "planning_llm": crew_data.planning,
            "knowledge_collection_id": crew_data.knowledge_collection_id,
        }

        if crew_data.memory:
            full_memory_config = copy.deepcopy(PGVECTOR_MEMORY_CONFIG)
            full_memory_config["config"]["run_id"] = session_id
            # TODO: uncomment after adding users
            # full_memory_config['config']['user_id'] = some_fetched_user_id

            crew_config["memory_config"] = full_memory_config

        config_id_tool_map = {
            tool_data.tool_config.id: self.proxy_tool_factory.create_proxy_class(
                tool_data=tool_data
            )()
            for tool_data in crew_data.tools
        }
        id_python_code_tool_map = {
            python_code_tool_data.id: self.proxy_tool_factory.create_python_code_proxy_tool_class(
                python_code_tool_data=python_code_tool_data,
                global_kwargs=global_kwargs,
            )()
            for python_code_tool_data in crew_data.python_code_tools
        }

        agent_data_list: list[AgentData] = crew_data.agents

        id_agent_map: dict[int, Agent] = {}
        for agent_data in agent_data_list:
            tool_list = [
                config_id_tool_map[tool_id] for tool_id in agent_data.tool_id_list
            ]
            python_code_tool_list = [
                id_python_code_tool_map[tool_id]
                for tool_id in agent_data.python_code_tool_id_list
            ]

            id_agent_map[agent_data.id] = self.parse_agent(
                agent_data,
                step_callback=crew_callback_factory.get_step_callback(
                    agent_id=agent_data.id,
                ),
                wait_for_user_callback=crew_callback_factory.get_wait_for_user_callback(
                    crew_knowledge_collection_id=crew_data.knowledge_collection_id,
                    agent_knowledge_collection_id=agent_data.knowledge_collection_id,
                ),
                inputs=inputs,
                tool_list=tool_list + python_code_tool_list,
            )
        crew_config["agents"] = id_agent_map.values()

        embedder = crew_data.embedder

        if embedder is not None:
            crew_config["embedder"] = embedder.model_dump(exclude_none=True)

        if crew_data.manager_llm:
            crew_config["manager_llm"] = parse_llm(llm=crew_data.manager_llm)

        if crew_data.planning_llm:
            crew_config["planning_llm"] = parse_llm(llm=crew_data.planning_llm)

        task_list_data: list[TaskData] = crew_data.tasks
        task_list_data.sort(key=lambda item: int(item.order))

        id_task_map: dict[int, Task] = {}
        for task_data in task_list_data:
            # Adding previous taks to context by id
            context_task_list = []
            for context_id in task_data.task_context_id_list:
                task = id_task_map.get(context_id)
                assert (
                    task is not None
                ), f"there were no previous tasks with id {context_id}"
                context_task_list.append(task)
            id_task_map[task_data.id] = self.parse_task(
                task_data=task_data,
                agent=id_agent_map.get(task_data.agent_id),
                task_callback=crew_callback_factory.get_task_callback(
                    task_id=task_data.id,
                ),
                context_tasks=context_task_list,
            )

        crew_config["tasks"] = id_task_map.values()

        # add context
        # TODO: add knowledge collection here also
        crew_config["manager_ask_human_input_callback"] = (
            crew_callback_factory.get_wait_for_user_callback()
        )

        return Crew(
            **crew_config,
        )
