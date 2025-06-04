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
        expected_channel = 'sessions:123:schema'
        expected_value = '{"key": "value"}'
        fake_redis_service.redis_client.set(expected_channel, expected_value)
        
        result = fake_redis_service.get_json_session_schema()
        assert result == expected_value, f"Expected {expected_value}, but got {result}"

    
    def test_parse_crew(self, mocker, fake_crew_data):
        
        with patch.dict(os.environ, {'SECRET_OPENAI_API_KEY': '123'}, clear=False):
            crew_parser = CrewParser()
            crew = crew_parser.parse_crew(crew_data=fake_crew_data)

        assert isinstance(crew, Crew)
