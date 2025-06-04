import pytest
import docker
from unittest.mock import Mock, MagicMock, patch
from docker.models.images import Image

from tests.tool_container.fixtures import tool_container_service, wikipedia_image, manager_container
from tests.tool_container.fixtures import test_network, docker_client


def test_request_class_data_image_exist(tool_container_service, wikipedia_image, manager_container):
    """
        - Given an existing container image for 'wikipedia_tool',
        - When `request_class_data` is called with the alias 'wikipedia',
        - Then a container for 'wikipedia_tool' should be running, and a request should be sent to its endpoint.
    """

    with patch('requests.get') as mock_requests_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_requests_get.return_value = mock_response

        tool_alias = 'wikipedia'
        response_data = tool_container_service.request_class_data(tool_alias=tool_alias)

        running_containers = tool_container_service.docker_client.containers.list()
        matching_containers = [c for c in running_containers if 'wikipedia_tool' in c.name]
        assert matching_containers, "No container found with name containing 'wikipedia_tool'"

        container = matching_containers[0]

        expected_url = f"http://{container.name}:8000/tool/{tool_alias}/class-data/"
        mock_requests_get.assert_called_with(expected_url)
