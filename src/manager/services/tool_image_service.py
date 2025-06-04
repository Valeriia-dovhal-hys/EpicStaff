import os

from services.build_tool import ToolDockerImageBuilder
from repositories.import_tool_data_repository import ImportToolDataRepository

import docker
from docker.models.images import Image
from docker.models.containers import Container
from docker.client import DockerClient


class ToolImageService:
    client: DockerClient = docker.client.from_env()

    def __init__(
        self, import_tool_data_repository: ImportToolDataRepository
    ):
        self.import_tool_data_repository = import_tool_data_repository

    def build_image(self, image_name: str) -> Image:

        import_tool_data = self.import_tool_data_repository.get_import_class_data(
            image_name=image_name
        )

        tdib: ToolDockerImageBuilder = ToolDockerImageBuilder(
            tool_dict=import_tool_data.tool_dict,
            import_list=import_tool_data.dependencies,
        )

        return tdib.build_tool_image(image_name=import_tool_data.image_name)
    

    def pull_from_dockerhub(self, image_name) -> Image | None:
        repo_host = os.getenv("DOCKERHUB_PROFILE_NAME")
        dockerhub_image_name = f"{repo_host}/{image_name}:latest"
        pulled_image = self.client.images.pull(dockerhub_image_name)
        if pulled_image:
            pulled_image.tag(image_name, force=True)
            pulled_image = self.client.images.get(image_name)
            self.client.images.remove(image=dockerhub_image_name)
            return pulled_image
        

    def get_or_build_tool_alias(self, tool_alias: str) -> Image:

        image_name = self.import_tool_data_repository.find_image_name_by_tool_alias(
            tool_alias=tool_alias
        )
        image_list = self.client.images.list(filters={"label": image_name})
        if image_list:
            return image_list[0]
        
        image = self.pull_from_dockerhub(image_name)
        if image: return image

        return self.build_image(image_name=image_name)
    
