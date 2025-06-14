from __future__ import annotations

import pytest
from typing import Generator, TYPE_CHECKING
from unittest.mock import MagicMock, patch
from docker import DockerClient

if TYPE_CHECKING:
    from services.crew_container_service import CrewContainerService
    from services.redis_service import RedisService


@pytest.fixture
def mock_docker_client() -> Generator[MagicMock, None, None]:
    with patch('docker.client.from_env') as mock_from_env:
        mock_client = MagicMock(spec=DockerClient)
        mock_from_env.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_crew_image_service() -> Generator[MagicMock, None, None]:
    with patch('services.crew_container_service.CrewImageService') as mock_service:
        mock_instance = MagicMock()
        mock_service.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_crew_container_service(mock_docker_client: MagicMock, mock_crew_image_service: MagicMock) -> Generator[CrewContainerService, None, None]:
    mock_manager_container = MagicMock()
    mock_manager_container.attrs = {
        'NetworkSettings': {
            'Networks': {
                'test_network': {}
            }
        }
    }
    mock_docker_client.containers.get.return_value = mock_manager_container

    from services.crew_container_service import CrewContainerService

    service = CrewContainerService()
    yield service


@pytest.fixture
def redis_service(mock_crew_container_service: CrewContainerService) -> Generator[RedisService, None, None]:
    with patch('services.redis_service.CrewContainerService', return_value=mock_crew_container_service):
        from services.redis_service import RedisService
        service = RedisService("test:sessions:start")
        yield service
