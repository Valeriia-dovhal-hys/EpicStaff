from pathlib import Path

import docker
from docker.models.images import Image

class CrewImageService:

    def __init__(self):
        self.client = docker.client.from_env()


    def build_image(self) -> Image:

        dockerfile = Path('./crew/Dockerfile.crew')
        image_files = Path('./crew')

        image = self.client.images.build(
            path=str(image_files.resolve()),
            tag='crew',
            dockerfile=str(dockerfile.resolve()),
        )[0]

        return image

    
    def get_image(self):
        
        image_list = self.client.images.list(filters={"label": "Crew"})
        if image_list:
            return image_list[0]
        
        return self.build_image()
