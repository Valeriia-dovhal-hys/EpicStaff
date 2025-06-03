import pytest
import docker
from unittest.mock import Mock, MagicMock, patch

from fixtures import tool_container_service, wikipedia_image, manager_container
from fixtures import test_network, docker_client


def test_request_class_data(tool_container_service, wikipedia_image, manager_container):

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


@pytest.mark.skip
def test_request_class_data_builds_image_when_image_missing(tool_container_service, docker_client, manager_container):
    image_name = 'wikipedia_tool'
    tag_name = f"{image_name}:latest"
    tool_alias = 'wikipedia'

    images_to_remove = docker_client.images.list(filters={"reference": tag_name})
    for img in images_to_remove:
        try:
            docker_client.images.remove(image=img.id, force=True)
        except docker.errors.ImageNotFound:
            pass

    tool_container_service.import_tool_data_repository.find_image_name_by_tool_alias.return_value = image_name

    with patch('os.getenv', return_value=''):

        with patch.object(tool_container_service.tool_image_service, 'build_image') as mock_build_image:

            mock_built_image = MagicMock()
            mock_built_image.tags = [tag_name]
            mock_build_image.return_value = mock_built_image

            with patch('requests.get') as mock_requests_get:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {}
                mock_requests_get.return_value = mock_response

                # import pdb
                # pdb.set_trace()
                response_data = tool_container_service.request_class_data(tool_alias=tool_alias)

                mock_build_image.assert_called_once_with(image_name)

                running_containers = docker_client.containers.list()
                matching_containers = [c for c in running_containers if tag_name in c.image.tags]
                assert matching_containers, "Expected container was not started after image build"

                container = matching_containers[0]

                expected_url = f"http://{container.name}:8000/tool/{tool_alias}/class-data/"
                mock_requests_get.assert_called_with(expected_url)

    for container in docker_client.containers.list(all=True):
        if tag_name in container.image.tags:
            container.stop()
            container.remove(force=True)

    try:
        docker_client.images.remove(image=image_name, force=True)
    except docker.errors.ImageNotFound:
        pass