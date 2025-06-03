from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, patch
import pytest
from django.urls import reverse

from tables.services.redis_service import RedisService
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
import fakeredis


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def openai_provider() -> Provider:
    openai_provider = Provider(name="openai")
    openai_provider.save()
    return openai_provider


@pytest.fixture
def gpt_4o_llm(openai_provider: Provider) -> LLMModel:
    openai_provider = LLMModel(name="gpt-4o", llm_provider=openai_provider)
    openai_provider.save()
    return openai_provider


@pytest.fixture
def llm_config() -> ConfigLLM:

    llm_config = ConfigLLM(temperature=0.5, num_ctx=25)
    llm_config.save()
    return llm_config


@pytest.fixture
def wikipedia_tool() -> Tool:

    wikipedia = Tool(
        name="Wikipedia",
        name_alias="wikipedia",
        description="Tool to search in wikipedia",
        requires_model=False,
    )
    wikipedia.save()
    return wikipedia


@pytest.fixture
def wikipedia_agent(
    gpt_4o_llm: LLMModel, llm_config: ConfigLLM, wikipedia_tool: Tool
) -> Agent:
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
def embedding_model(openai_provider: Provider) -> EmbeddingModel:
    embedding = EmbeddingModel(
        name="text-embedding-3-small", embedding_provider=openai_provider
    )
    embedding.save()
    return embedding


@pytest.fixture
def crew(
    wikipedia_agent: Agent,
    embedding_model: EmbeddingModel,
    gpt_4o_llm: LLMModel,
    llm_config: ConfigLLM,
) -> Crew:
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
def redis_client_mock() -> Generator[MagicMock, None, None]:
    redis_service = RedisService()
    mock_instance = MagicMock()
    with patch.object(redis_service, "_redis_client", mock_instance):
        yield mock_instance


@pytest.fixture
def session_schema_json() -> str:
    path = Path("./tests/resources/session_schema.json").resolve()

    with open(path, "r") as f:
        schema_json = f.read()

    return schema_json


@pytest.fixture
def fake_redis_client() -> Generator[MagicMock, None, None]:
    redis_mock = MagicMock()
    fake_redis_client = fakeredis.FakeRedis(server=fakeredis.FakeServer())
    with patch("redis.Redis", redis_mock):
        redis_mock.return_value = fake_redis_client
        yield fake_redis_client
