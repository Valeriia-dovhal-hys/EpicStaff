from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, patch
import pytest

from tables.services.config_service import YamlConfigService
from tables.services.redis_service import RedisService
from tables.models import (
    Agent,
    ConfigLLM,
    Crew,
    EmbeddingModel,
    LLMModel,
    Provider,
    Task,
    Tool,
)
import fakeredis




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
def test_task(wikipedia_agent) -> Task:

    task = Task(
        name="test task",
        agent=wikipedia_agent,
        instructions="some instructions",
        expected_output="some output",
        order=1,
    )
    task.save()
    return task


@pytest.fixture
def crew(
    wikipedia_agent: Agent,
    embedding_model: EmbeddingModel,
    gpt_4o_llm: LLMModel,
    llm_config: ConfigLLM,
    test_task: Task
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
    test_task.crew = crew
    test_task.save()
    crew.save()

    return crew


@pytest.fixture
def redis_client_mock() -> Generator[MagicMock, None, None]:
    redis_service = RedisService()
    mock_instance = MagicMock()
    with patch.object(redis_service, "_redis_client", mock_instance):
        yield mock_instance


@pytest.fixture
def fake_redis_client() -> Generator[MagicMock, None, None]:
    redis_mock = MagicMock()
    fake_redis_client = fakeredis.FakeRedis(server=fakeredis.FakeServer())
    with patch("redis.Redis", redis_mock):
        redis_mock.return_value = fake_redis_client
        yield fake_redis_client



@pytest.fixture
def yaml_config_service_patched_config_path(tmp_path: Path) -> Generator[MagicMock, None, None]:
    tmp_path.mkdir(exist_ok=True)
    config_path: Path = tmp_path / "config.yaml"
    with patch.object(YamlConfigService, "_CONFIG_PATH", config_path):
        yield config_path
    
    config_path.unlink()
    
    