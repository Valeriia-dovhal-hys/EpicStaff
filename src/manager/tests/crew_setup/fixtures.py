import pytest
import docker
import io


@pytest.fixture(scope="module")
def docker_client():
    return docker.from_env()


@pytest.fixture(scope="function")
def crew_image():
    docker_client = docker.from_env()

    dockerfile = """
    FROM alpine:latest
    CMD ["echo", "Hello, World!"]
    """

    image, _ = docker_client.images.build(fileobj=io.BytesIO(dockerfile.encode('utf-8')), tag="crew")
    yield image
    
    docker_client.images.remove(image.id, force=True)