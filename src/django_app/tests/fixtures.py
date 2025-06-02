from unittest.mock import MagicMock, patch
import pytest
from django.urls import reverse

from tables.models import (
    Agent,
    ConfigLLM,
    Crew,
    EmbeddingModel,
    LLMModel,
    Provider,
    Tool,
)
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def openai_provider():
    openai_provider = Provider(name="openai")
    openai_provider.save()
    return openai_provider


@pytest.fixture
def gpt_4o_llm(openai_provider):
    openai_provider = LLMModel(name="gpt-4o", llm_provider=openai_provider)
    openai_provider.save()
    return openai_provider


@pytest.fixture
def llm_config():

    llm_config = ConfigLLM(temperature=0.5, num_ctx=25)
    llm_config.save()
    return llm_config


@pytest.fixture
def wikipedia_tool():

    wikipedia = Tool(
        name="Wikipedia",
        name_alias="wikipedia",
        description="Tool to search in wikipedia",
        requires_model=False,
    )
    wikipedia.save()
    return wikipedia


@pytest.fixture
def wikipedia_agent(gpt_4o_llm, llm_config, wikipedia_tool):
    agent = Agent(
        role="Wikipedia searcher",
        goal="Search in wikipedia and give short summary on what you found",
        backstory="You are an experienced wikipedia user",
        allow_delegation=True,
        memory=True,
        max_iter=25,
        llm_model=gpt_4o_llm,
        llm_config=llm_config,
        fcm_llm_model=gpt_4o_llm,
        fcm_llm_config=llm_config,
    )
    agent.save()
    agent.tools.set([wikipedia_tool])
    agent.save()
    return agent


@pytest.fixture
def embedding_model(openai_provider):
    embedding = EmbeddingModel(
        name="text-embedding-3-small", embedding_provider=openai_provider
    )
    embedding.save()
    return embedding


@pytest.fixture
def crew(wikipedia_agent, embedding_model, gpt_4o_llm, llm_config):
    crew = Crew(
        name="Test Crew",
        description="crew for tests",
        assignment="Give best results",
        process="sequential",
        memory=True,
        embedding_model=embedding_model,
        manager_llm_model=gpt_4o_llm,
        manager_llm_config=llm_config,
    )

    crew.save()
    crew.agents.set([wikipedia_agent])
    crew.save()

    return crew



@pytest.fixture
def mock_redis():
    with patch('redis.Redis') as mock_redis_class:
        mock_instance = MagicMock()
        mock_redis_class.return_value = mock_instance
        yield mock_instance
