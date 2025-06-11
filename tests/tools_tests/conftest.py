import pytest
from crewai import Agent


@pytest.fixture(scope="function")
def agent():
    yield Agent(
        role="test role",
        goal="test goal",
        backstory="test backstory",
        allow_delegation=False,
    )