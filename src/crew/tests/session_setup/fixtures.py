from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Generator

import pytest
import fakeredis
from unittest.mock import patch, MagicMock
from polyfactory.factories.pydantic_factory import ModelFactory

from models.request_models import (
    AgentData,
    ConfigLLMData,
    CrewData,
    EmbeddingModelData,
    LLMModelData,
    TaskData,
)


class CrewDataFactory(ModelFactory[CrewData]):
    __model__ = CrewData


class TaskDataFactory(ModelFactory[TaskData]):
    __model__ = TaskData


class AgentDataFactory(ModelFactory[AgentData]):
    __model__ = AgentData



gpt_4o_data = {
    "name": "gpt-4o",
    "llm_provider": {
        "name": "openai"
    }
}
llm_config_data = {
    "temperature": 0.7,
    "num_ctx": 25,
}
embedding_model_data = {
    "name": "gpt-4o",
    "embedding_provider": {
        "name": "openai"
    }
}

gpt_4o_model_validated = LLMModelData.model_validate(gpt_4o_data)
llm_config_validated_model = ConfigLLMData.model_validate(llm_config_data)
embedding_validated_model = EmbeddingModelData.model_validate(embedding_model_data)

@pytest.fixture
def fake_agent_data():
    fake_agent_data = AgentDataFactory.build()

    fake_agent_data.tools = []
    fake_agent_data.llm_model = gpt_4o_model_validated
    fake_agent_data.fcm_llm_model = gpt_4o_model_validated
    fake_agent_data.llm_config = llm_config_validated_model
    fake_agent_data.fcm_llm_config = llm_config_validated_model
    fake_crew_data.agents = [fake_agent_data]

    yield fake_agent_data


@pytest.fixture
def fake_task_data(fake_agent_data):
    fake_task_data = TaskDataFactory.build()
    fake_task_data.agent = fake_agent_data

    yield fake_task_data


@pytest.fixture
def fake_crew_data(fake_agent_data, fake_task_data):
    fake_crew_data = CrewDataFactory.build(
        process='sequential'
    )
    fake_task_data.crew = fake_crew_data

    fake_crew_data.manager_llm_model = gpt_4o_model_validated
    fake_crew_data.manager_llm_config = llm_config_validated_model
    fake_crew_data.embedding_model = embedding_validated_model
    fake_crew_data.agents = [fake_agent_data]
    fake_crew_data.tasks = [fake_task_data]
    
    yield fake_crew_data
