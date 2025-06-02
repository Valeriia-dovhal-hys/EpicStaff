import pytest
from pytest_mock import MockFixture
from pytest_mock import mocker
from unittest.mock import MagicMock

from fixtures import crew_image

from docker.models.images import Image

class TestCrewSetup:

    def test_request_run_crew_existing_container(self, mocker: MockFixture):

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
        crew_container_service.request_run_crew(session_id)

        # Assertions
        mock_existing_container.remove.assert_called_once_with(force=True)
        mock_run.assert_called_once()
        mock_run.assert_called_with(
            image=mock_image,
            ports={"7000/tcp": 0},
            network=crew_container_service.network_name,
            environment={
                "SESSION_ID": str(session_id),
                "HAYSTACK_TELEMETRY_ENABLED": False,
                "ANONYMIZED_TELEMETRY": False,
                "EC_TELEMETRY": False,
                "MONITORING_MODE": "local",
                "PROCESS_REDIS_HOST": "redis",
            },
            mounts=[
                mocker.ANY
            ],
            detach=True,
            name=container_name,
        )


    def test_get_image_existing(self, mocker: MockFixture, crew_image):

        from services.crew_image_service import CrewImageService
        service = CrewImageService()

        mock_build_image = mocker.patch.object(service, 'build_image')

        image = service.get_image()

        assert image is not None
        assert "crew:latest" in image.tags

        mock_build_image.assert_not_called()