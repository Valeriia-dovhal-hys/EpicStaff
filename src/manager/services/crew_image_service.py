from pathlib import Path

import docker
from docker.models.images import Image


class CrewImageService:

    def __init__(self):
        self.client = docker.client.from_env()

    def build_image(self) -> Image:

        dockerfile = Path("./crew/Dockerfile.crew").resolve().as_posix()
        image_files = Path("./crew").resolve().as_posix()

        image = self.client.images.build(
            path=image_files,
            tag="crew",
            dockerfile=dockerfile,
        )[0]

        return image

    def get_image(self):

        image_list = self.client.images.list(name="crew")
        if image_list:
            return image_list[0]

        return self.build_image()
