from enum import Enum
from docker.models.images import Image

from .build_langchain_tool import ToolDockerImageBuilder, get_image_by_name, client
from .base_models import *
from .proxy_tool_builder import ProxyToolBuilder


def import_tool(import_tool_data: ImportToolData):
    dependencies = import_tool_data.dependencies
    force_build = import_tool_data.force_build

    if dependencies is None:
        dependencies = []

    ltdib = ToolDockerImageBuilder(
        callable=import_tool_data.callable,
        import_list=dependencies,
    )

    image_name = import_tool_data.callable.class_name.lower()

    image: Image | None = get_image_by_name(image_name=image_name)  # optimize

    if force_build or not image:
        image = ltdib.build_tool(name=image_name)[0]

    # TODO: refactor

    port = 5005

    container_tool = client.containers.run(
        image=image, ports={"8000/tcp": port}, detach=True
    )

    proxy_tool_builder = ProxyToolBuilder(image=image, port=port)

    return proxy_tool_builder.build()
