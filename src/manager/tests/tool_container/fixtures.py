import io
import os
import pytest
import json
import docker
from unittest.mock import MagicMock, Mock, patch

from repositories.import_tool_data_repository import ImportToolDataRepository

tool_data_repo = ImportToolDataRepository()


@pytest.fixture(scope="module")
def docker_client():
    return docker.from_env()


@pytest.fixture(scope="module")
def test_network(docker_client):
    network = docker_client.networks.create('test_network', driver='bridge')
    yield network
    
    connected_containers = docker_client.networks.get(network.id).containers
    for container in connected_containers:
        network.disconnect(container)
        
    network.remove()


@pytest.fixture(scope="module")
def manager_container(docker_client, test_network):
    container = docker_client.containers.run(
        'alpine:latest',
        name='manager_container',
        command='sleep 3600',
        detach=True,
        network=test_network.name
    )
    yield container
    
    container.stop()
    container.remove()
    

@pytest.fixture(scope="module")
def wikipedia_image(docker_client):
    os.environ['DOCKERHUB_PROFILE_NAME'] = ''

    image_name = 'wikipedia_tool'
    tag_name = f"{image_name}:latest"

    images_to_remove = docker_client.images.list(filters={"reference": tag_name})
    for img in images_to_remove:
        try:
            docker_client.images.remove(image=img.id, force=True)
        except docker.errors.ImageNotFound:
            pass

    images = docker_client.images.list(filters={"reference": tag_name})
    if images:
        image = images[0]
    else:
        dockerfile = '''
        FROM alpine:latest
        LABEL wikipedia_tool=""
        CMD ["sleep", "3600"]
        '''
        image, build_logs = docker_client.images.build(
            fileobj=io.BytesIO(dockerfile.encode('utf-8')),
            tag=tag_name,
            labels={image_name: ''}
        )

    image.tag(tag_name)
        
    yield image

    for container in docker_client.containers.list(all=True):
        if f"{image_name}:latest" in container.image.tags:
            container.stop()
            container.remove(force=True)

    docker_client.images.remove(image=image.id, force=True)


@pytest.fixture
def tool_container_service(docker_client):

    import_tool_data_repository = Mock()
    import_tool_data_repository.find_image_name_by_tool_alias.return_value = 'wikipedia_tool'

    from services.tool_image_service import ToolImageService
    from services.tool_container_service import ToolContainerService
    mock_pull = patch("services.tool_image_service.ToolImageService.client.images.pull", return_value=[])
    mock_pull.start()
    tool_image_service = ToolImageService(import_tool_data_repository)
    tool_image_service.client = docker_client

    service = ToolContainerService(
        tool_image_service=tool_image_service,
        import_tool_data_repository=import_tool_data_repository
    )
    service.docker_client = docker_client
    return service


@pytest.fixture
def mock_tool_image_service(mocker):
    mock_docker_from_env = mocker.patch("docker.from_env")
    mock_client = MagicMock()
    mock_docker_from_env.return_value = mock_client

    from services.tool_image_service import ToolImageService
    tool_image_service = ToolImageService(tool_data_repo)

    return tool_image_service


@pytest.fixture
def mock_tool_container_service(mocker, tool_image_service):
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

    from services.tool_container_service import ToolContainerService
    tool_container_service = ToolContainerService(tool_image_service, tool_data_repo)
    return tool_container_service


@pytest.fixture
def tools_config_file(tmpdir):

    tools_config_content = [
        {
            "image_name": "wolfram_alpha",
            "tool_dict": {
                "wolfram_alpha": {
                    "class_name": "WolframAlphaQueryRun",
                    "kwargs": {
                        "api_wrapper": {
                            "package": "langchain_community",
                            "callable_name": "WolframAlphaAPIWrapper",
                            "kwargs": {
                                "wolfram_alpha_appid": "123"
                            }
                        }
                    }
                }
            },
            "dependencies": [
                "wolframalpha", "langchain", "langchain_community"
            ]
        }
    ]

    tools_config_path = tmpdir.join("tools_config.json")

    with open(tools_config_path, 'w') as f:
        json.dump(tools_config_content, f)

    return tools_config_path


@pytest.fixture
def tools_paths_file(tmpdir):
    tools_paths_content = {
        "WolframAlphaQueryRun": "langchain_community.tools.wolfram_alpha.tool",
        "WolframAlphaAPIWrapper": "langchain_community.utilities.wolfram_alpha"
    }

    tools_paths_path = tmpdir.join("tools_paths.json")

    with open(tools_paths_path, 'w') as f:
        json.dump(tools_paths_content, f)

    return tools_paths_path