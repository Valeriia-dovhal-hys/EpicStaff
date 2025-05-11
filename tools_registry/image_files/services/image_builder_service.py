from tools_registry.image_files.services.docker_tools.build_tool import (
    ToolDockerImageBuilder,
)
from tools_registry.image_files.services.registry import Registry
from tools_registry.image_files.repositories.import_tool_data_repository import (
    ImportToolDataRepository,
)
from docker.models.images import Image


class ImageBuilderService:

    def __init__(
        self, registry: Registry, import_tool_data_repository: ImportToolDataRepository
    ):
        self.registry = registry
        self.import_tool_data_repository = import_tool_data_repository

    def build_tool_alias(self, tool_alias: str) -> Image:

        image_name = self.import_tool_data_repository.find_image_name_by_tool_alias(
            tool_alias=tool_alias
        )

        import_tool_data = self.import_tool_data_repository.get_import_class_data(
            image_name=image_name
        )

        tdib: ToolDockerImageBuilder = ToolDockerImageBuilder(
            tool_dict=import_tool_data.tool_dict,
            import_list=import_tool_data.dependencies,
        )

        return tdib.build_tool_image(image_name=import_tool_data.image_name)
