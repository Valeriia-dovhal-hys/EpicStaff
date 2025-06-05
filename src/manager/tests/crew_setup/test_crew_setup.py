import pytest
from pytest_mock import MockFixture
from pytest_mock import mocker
from unittest.mock import MagicMock

from tests.crew_setup.fixtures import crew_image, mocked_crew_service_bundle

class TestCrewSetup:

    def test_request_run_crew_existing_container(self, mocker: MockFixture, mocked_crew_service_bundle):
        """
            - Given an existing container for the specified session ID,
            - When `request_run_crew` is called,
            - Then the existing container should be removed, and a new container started with the specified environment and network settings.
        """

        session_id, crew_service_setup, mocked_existing_container, mocked_run, mocked_image = mocked_crew_service_bundle
        
        crew_service_setup.request_run_crew(session_id)

        mocked_existing_container.remove.assert_called_once_with(force=True)
        mocked_run.assert_called_once()
        mocked_run.assert_called_with(
            image=mocked_image,
            ports={"7000/tcp": 0},
            network=crew_service_setup.network_name,
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
            name=f"crew_session-{session_id}",
        )


    def test_get_image_existing(self, mocker: MockFixture, crew_image):
        """
            - Given an existing Docker image with the tag 'crew:latest',
            - When `get_image` is called,
            - Then the method should return the existing image without calling `build_image`.
        """

        from services.crew_image_service import CrewImageService
        service = CrewImageService()

        mock_build_image = mocker.patch.object(service, 'build_image')

        image = service.get_image()

        assert image is not None
        assert "crew:latest" in image.tags

        mock_build_image.assert_not_called()
        