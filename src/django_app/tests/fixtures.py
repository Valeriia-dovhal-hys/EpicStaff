from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, patch
import shutil
import pytest
from django.core.management import call_command
from tables.models.realtime_models import RealtimeAgent
from tables.models.llm_models import (
    RealtimeConfig,
    RealtimeModel,
    RealtimeTranscriptionConfig,
    RealtimeTranscriptionModel,
)
from tables.models.crew_models import DefaultAgentConfig, DefaultCrewConfig
from tables.services.config_service import YamlConfigService
from tables.services.redis_service import RedisService

from tables.models import (
    LLMConfig,
    EmbeddingConfig,
    EmbeddingModel,
    LLMModel,
    Provider,
    Crew,
    Agent,
    Task,
    Tool,
    ToolConfig,
    ToolConfigField,
    Session,
)

from django.utils.crypto import get_random_string


import fakeredis


@pytest.fixture(autouse=True)
def reset_db():
    call_command("flush", "--noinput")


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
def gpt_35_llm(openai_provider: Provider) -> LLMModel:
    openai_provider = LLMModel(name="gpt-3.5-turbo", llm_provider=openai_provider)
    openai_provider.save()
    return openai_provider


@pytest.fixture
def llm_config(gpt_4o_llm) -> LLMConfig:

    llm_config = LLMConfig(
        custom_name="MyGPT-4o",
        model=gpt_4o_llm,
        temperature=0.5,
        is_visible=True,
    )
    llm_config.save()
    return llm_config


@pytest.fixture
def default_agent_config(llm_config) -> DefaultAgentConfig:

    default_agent_config = DefaultAgentConfig(
        allow_delegation=False, memory=False, max_iter=25, llm_config=llm_config
    )
    default_agent_config.save()
    return default_agent_config


@pytest.fixture
def default_crew_config(llm_config) -> DefaultCrewConfig:

    default_crew_config = DefaultCrewConfig(
        process="sequential",
        memory=False,
        embedding_config=None,
        manager_llm_config=llm_config,
    )
    default_crew_config.save()
    return default_crew_config


@pytest.fixture
def new_llm_config(gpt_4o_llm):

    llm_config = LLMConfig(
        model=gpt_4o_llm, temperature=0.9, num_ctx=1024, is_visible=True
    )
    llm_config.save()
    return llm_config


@pytest.fixture
def wikipedia_tool() -> Tool:

    wikipedia = Tool(
        name="Wikipedia",
        name_alias="wikipedia",
        description="Tool to search in wikipedia",
    )
    wikipedia.save()
    return wikipedia


@pytest.fixture
def wikipedia_tool_config(wikipedia_tool) -> ToolConfig:
    return ToolConfig.objects.create(
        name="wikipedia config", tool=wikipedia_tool, configuration={}
    )


@pytest.fixture
def wikipedia_agent(
    gpt_4o_llm: LLMModel, llm_config: LLMConfig, wikipedia_tool_config: ToolConfig
) -> Agent:
    agent = Agent(
        role="Wikipedia searcher",
        goal="Search in wikipedia and give short summary on what you found",
        backstory="You are an experienced wikipedia user",
        allow_delegation=True,
        memory=True,
        max_iter=25,
        llm_config=llm_config,
        fcm_llm_config=llm_config,
    )
    agent.save()
    agent.configured_tools.set([wikipedia_tool_config.pk])
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
def embedding_config(embedding_model: EmbeddingModel) -> EmbeddingConfig:
    embedding_config = EmbeddingConfig(
        model=embedding_model,
        task_type="retrieval_document",
    )
    embedding_config.save()
    return embedding_config


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
    embedding_config: EmbeddingConfig,
    llm_config: LLMConfig,
    test_task: Task,
) -> Crew:
    crew = Crew(
        name="Test Crew",
        description="crew for tests",
        process="sequential",
        memory=True,
        embedding_config=embedding_config,
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
def yaml_config_service_patched_config_path(
    tmp_path: Path,
) -> Generator[MagicMock, None, None]:
    tmp_path.mkdir(exist_ok=True)
    config_path: Path = tmp_path / "config.yaml"
    with patch.object(YamlConfigService, "_CONFIG_PATH", config_path):
        yield config_path

    shutil.rmtree(tmp_path)


@pytest.fixture
def session_factory(db):
    def create_session(**kwargs):
        return Session.objects.create(**kwargs)

    return create_session


@pytest.fixture
def test_tool():

    return Tool.objects.create(
        name="Test Tool",
        name_alias="test_tool",
        description="test tool description",
    )


@pytest.fixture
def test_tool_with_fields(test_tool):

    field1 = ToolConfigField(
        tool=test_tool,
        name="llm_config",
        description="tool llm",
        data_type=ToolConfigField.FieldType.LLM_CONFIG,
        required=True,
    )

    field2 = ToolConfigField(
        tool=test_tool,
        name="embedding_config",
        description="tool embedder",
        data_type=ToolConfigField.FieldType.EMBEDDING_CONFIG,
        required=False,
    )

    field3 = ToolConfigField(
        tool=test_tool,
        name="url",
        description="custom url field",
        data_type=ToolConfigField.FieldType.STRING,
        required=True,
    )

    field1.save()
    field2.save()
    field3.save()

    return test_tool


@pytest.fixture
def test_tool_github_search():

    return Tool.objects.create(
        id=13,
        name="Test GitHub Search Tool",
        name_alias="test_github_search",
        description="test Tool for searching GitHub repositories",
    )


@pytest.fixture
def test_tool_github_search_with_fields(test_tool_github_search):

    llm_config = ToolConfigField(
        tool=test_tool_github_search,
        name="llm_config",
        description="TEST Field for LLM Configuration",
        data_type=ToolConfigField.FieldType.LLM_CONFIG,
        required=True,
    )

    embedding_config = ToolConfigField(
        tool=test_tool_github_search,
        name="embedding_config",
        description="TEST Field for Embedding Configuration",
        data_type=ToolConfigField.FieldType.EMBEDDING_CONFIG,
        required=True,
    )

    github_repo = ToolConfigField(
        tool=test_tool_github_search,
        name="github_repo",
        description="TEST The URL of the GitHub repository",
        data_type=ToolConfigField.FieldType.STRING,
        required=True,
    )

    gh_token = ToolConfigField(
        tool=test_tool_github_search,
        name="gh_token",
        description="TEST Your GitHub Personal Access Token",
        data_type=ToolConfigField.FieldType.STRING,
        required=True,
    )

    content_types = ToolConfigField(
        tool=test_tool_github_search,
        name="content_types",
        description="TEST Specifies the types of content to include in your search.",
        data_type=ToolConfigField.FieldType.ANY,
        required=True,
    )

    llm_config.save()
    embedding_config.save()
    github_repo.save()
    gh_token.save()
    content_types.save()

    return test_tool_github_search


@pytest.fixture
def openai_realtime_model(openai_provider):
    realtime_model = RealtimeModel.objects.create(
        name="Test Realtime Model", provider=openai_provider
    )
    return realtime_model


@pytest.fixture
def openai_realtime_model_config(openai_realtime_model):

    # Create and return the `RealtimeModelConfig` instance
    config = RealtimeConfig.objects.create(
        custom_name="test", api_key="test", realtime_model=openai_realtime_model
    )
    return config


@pytest.fixture
def realtime_transcription_model(openai_provider):
    return RealtimeTranscriptionModel.objects.create(
        name="whisper-1", provider=openai_provider
    )


@pytest.fixture
def realtime_transcription_config(realtime_transcription_model):
    return RealtimeTranscriptionConfig.objects.create(
        custom_name="test_realtime_transcription_config",
        realtime_transcription_model=realtime_transcription_model,
        api_key="mock key",
    )


@pytest.fixture
def wikipedia_agent_with_configured_realtime(
    wikipedia_agent, openai_realtime_model_config, realtime_transcription_config
):
    RealtimeAgent.objects.create(
        agent=wikipedia_agent,
        realtime_config=openai_realtime_model_config,
        realtime_transcription_config=realtime_transcription_config,
    )

    return wikipedia_agent
