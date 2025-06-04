from __future__ import annotations

import pytest
import docker
import io
from typing import Tuple, Generator, TYPE_CHECKING
from docker.client import DockerClient
from docker.models.images import Image
from pytest_mock import mocker
from unittest.mock import MagicMock

if TYPE_CHECKING:
    from services.crew_container_service import CrewContainerService


@pytest.fixture
def mocked_crew_service_bundle(mocker) -> Tuple[int, CrewContainerService, MagicMock, MagicMock, MagicMock]:
        
        mock_docker_from_env = mocker.patch("docker.client.from_env")
        mock_client = MagicMock()
        mock_docker_from_env.return_value = mock_client

        mock_containers = mock_client.containers
        mock_run = mock_containers.run

        mock_manager_container = MagicMock()
        mock_containers.get.return_value = mock_manager_container
        mock_manager_container.attrs = {
            'NetworkSettings': {
                'Networks': {
                    'test_network': {}
                }
            }
        }

        mock_image_service = mocker.patch("services.crew_image_service.CrewImageService")
        mock_crew_image_service = MagicMock()
        mock_image = MagicMock()
        mock_image.name = "crew"
        mock_crew_image_service.get_image.return_value = mock_image
        mock_image_service.return_value = mock_crew_image_service

        session_id = 123
        container_name = f"crew_session-{session_id}"

        mock_existing_container = MagicMock()
        mock_existing_container.name = container_name
        mock_existing_container.remove = MagicMock()

        mock_containers.list.return_value = [mock_existing_container]

        from services.crew_container_service import CrewContainerService
        crew_container_service = CrewContainerService()

        return session_id, crew_container_service, mock_existing_container, mock_run, mock_image


@pytest.fixture(scope="module")
def docker_client() -> DockerClient:
    return docker.from_env()


@pytest.fixture(scope="function")
def crew_image() -> Generator[Image, None, None]:
    docker_client = docker.from_env()

    dockerfile = """
    FROM alpine:latest
    CMD ["echo", "Hello, World!"]
    """

    image, _ = docker_client.images.build(fileobj=io.BytesIO(dockerfile.encode('utf-8')), tag="crew")
    yield image
    
    docker_client.images.remove(image.id, force=True)
    