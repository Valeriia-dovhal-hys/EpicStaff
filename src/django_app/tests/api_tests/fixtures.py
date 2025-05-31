import pytest
from django.urls import reverse

from tables.models import LLMModel, Provider


@pytest.fixture
@pytest.mark.django_db
def create_openai_provider():
    openai_provider = Provider(name="openai")
    openai_provider.save()
    yield openai_provider


@pytest.fixture
@pytest.mark.django_db
def create_llm():
    openai_provider = LLMModel(
        name="gpt-4o",
    )
    openai_provider.save()
    yield openai_provider


@pytest.fixture
@pytest.mark.django_db
def create_agents():
    reverse()
    pass


@pytest.fixture
@pytest.mark.django_db
def create_crew():
    provider = Provider(name="name")
    provider.save()
    pass
