from docker.models.images import Image
from docker import client


class RunnerSerivce:

    def __init__(self): ...

    def run_image(image: Image, port: int = 0):
        container_tool = client.containers.run(
            image=image, ports={"8000/tcp": port}, detach=True
        )
