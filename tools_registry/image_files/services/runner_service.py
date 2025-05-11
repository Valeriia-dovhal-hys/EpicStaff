from docker.models.images import Image
import docker

client = docker.client.from_env()

class RunnerService:

    def __init__(self): ...

    def run_image(self, image: Image, tool_alias=None, port: int = 0):
        container_tool = client.containers.run(
            image=image, 
            ports={"8000/tcp": port}, 
            network="my-net",
            detach=True,
            name=tool_alias
        )

        return container_tool
    