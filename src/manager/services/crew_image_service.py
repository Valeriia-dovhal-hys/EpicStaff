from pathlib import Path

import docker
from docker.models.images import Image

from helpers.logger import logger


class CrewImageService:

    def __init__(self):
        self.client = docker.client.from_env()

    def build_image(self) -> Image:

        dockerfile = Path("./crew/Dockerfile.crew").resolve().as_posix()
        image_files = Path("./crew").resolve().as_posix()

        try:
            image = self.client.images.build(
                path=image_files,
                tag="crew",
                dockerfile=dockerfile,
            )[0]
            logger.info("Docker image 'crew' built successfully.")
        except Exception as e:
            logger.error(f"Error occurred while building Docker image: {str(e)}")
            raise

        return image

    def get_image(self):
        
        image_list = self.client.images.list(name="crew")
        if image_list:
            logger.info("Docker image 'crew' found.")
            return image_list[0]
        
        logger.info("Docker image 'crew' not found, building a new image. This may take a while...")
        return self.build_image()
