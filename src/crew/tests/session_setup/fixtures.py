from __future__ import annotations
from typing import TYPE_CHECKING, Generator

if TYPE_CHECKING:
    from models.request_models import AgentData, TaskData, CrewData

import pytest
from polyfactory.factories.pydantic_factory import ModelFactory

from models.request_models import (
    AgentData,
    CrewData,
    EmbedderData,
    LLMData,
    TaskData,
)


class CrewDataFactory(ModelFactory[CrewData]):
    __model__ = CrewData


class TaskDataFactory(ModelFactory[TaskData]):
    __model__ = TaskData


class AgentDataFactory(ModelFactory[AgentData]):
    __model__ = AgentData


gpt_4o_data = {
    "provider": "openai",
    "config": {
        "model": "gpt-4o",
        "temperature": 0.7,
    }
}

embedding_model_data = {
    "provider": "openai",
    "config": {
        "model": "text-embedding-3-small",
        "temperature": 0.7,
    }
}

gpt_4o_model_validated = LLMData.model_validate(gpt_4o_data)
embedder_validated_model = EmbedderData.model_validate(embedding_model_data)


@pytest.fixture
def fake_agent_data() -> Generator[AgentData, None, None]:
    fake_agent_data = AgentDataFactory.build()

    fake_agent_data.tools = []
    fake_agent_data.llm = gpt_4o_model_validated
    fake_agent_data.function_calling_llm = gpt_4o_model_validated

    yield fake_agent_data


@pytest.fixture
def fake_task_data(fake_agent_data: AgentData) -> Generator[TaskData, None, None]:
    fake_task_data = TaskDataFactory.build()
    fake_task_data.agent = fake_agent_data

    yield fake_task_data


@pytest.fixture
def fake_crew_data(fake_agent_data: AgentData, fake_task_data: TaskData) -> Generator[CrewData, None, None]:
    fake_crew_data = CrewDataFactory.build(
        process='sequential'
    )
    fake_task_data.crew = fake_crew_data

    fake_crew_data.manager_llm = gpt_4o_model_validated
    fake_crew_data.embedder = embedder_validated_model
    fake_crew_data.agents = [fake_agent_data]
    fake_crew_data.tasks = [fake_task_data]
    
    yield fake_crew_data
