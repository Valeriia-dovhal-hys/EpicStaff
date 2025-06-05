from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Generator

import pytest
import fakeredis
from unittest.mock import patch, MagicMock
from services.redis_service import RedisService


fakeredis_client = fakeredis.FakeStrictRedis

@pytest.fixture
def fake_redis_service() -> Generator[RedisService, None, None]:

    with patch('services.redis_service.Redis', fakeredis_client):
        service = RedisService(
            container_manager_service=MagicMock(),
            session_id=123
        )
        yield service