from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pytest_mock import MockerFixture

import os
import pytest
from unittest.mock import patch
from services.crew_parser import CrewParser
from crewai import Crew

from tests.session_setup.fixtures import (
    fake_crew_data,
    fake_agent_data,
    fake_task_data,
)


class TestSessionSetup():

    def test_get_json_session_schema(
            self,
            mocker: MockerFixture,
            fake_redis_service
    ):
        """
        - Set a mock Redis key with expected channel name and JSON value.
        - Call get_json_session_schema() to retrieve the value from Redis.
        - Assert that the retrieved value matches the expected JSON string.
        """

        expected_channel = 'sessions:123:schema'
        expected_value = '{"key": "value"}'
        fake_redis_service.redis_client.set(expected_channel, expected_value)
        
        result = fake_redis_service.get_json_session_schema()
        assert result == expected_value, f"Expected {expected_value}, but got {result}"

    
    def test_parse_crew(self, mocker, fake_crew_data):
        """
        - Set a mock environment variable 'SECRET_OPENAI_API_KEY' required for parsing.
        - Prepare mock crew data using a factory.
        - Use CrewParser to parse the mock data.
        - Assert that the output is a valid Crew object.
        """
        
        with patch.dict(os.environ, {'SECRET_OPENAI_API_KEY': '123'}, clear=False):
            crew_parser = CrewParser()
            crew = crew_parser.parse_crew(crew_data=fake_crew_data)

        assert isinstance(crew, Crew)
