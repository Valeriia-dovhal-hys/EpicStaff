from services.docker_tools.build_tool import ToolDockerImageBuilder
from repositories.import_tool_data_repository import ImportToolDataRepository
from docker.models.images import Image
import docker
from docker.models.containers import Container
from docker.client import DockerClient


class ToolImageService:
    docker_client: DockerClient = docker.from_env()

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

    def get_or_build_tool_alias(self, tool_alias: str) -> Image:

        image_name = self.import_tool_data_repository.find_image_name_by_tool_alias(
            tool_alias=tool_alias
        )
        image_list = self.docker_client.images.list(filters={"label": image_name})
        if image_list:
            return image_list[0]

        return self.build_image(image_name=image_name)
