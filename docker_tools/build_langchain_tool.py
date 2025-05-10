from importlib.metadata import version
from importlib import import_module
from pathlib import Path
from json import dumps
from typing import Any
from langchain.tools.ddg_search import DuckDuckGoSearchRun


import docker
from docker.models.images import Image

from .base_models import Callable
from .pickle_encode import obj_to_txt

client = docker.from_env()


class ToolDockerImageBuilder:
    dockerfile = Path("./docker_tools/Dockerfile.tool")
    image_files = Path("./docker_tools/image_files/")

    default_imports = [
        "python-dotenv",
        "pydantic",
        "fastapi[all]",
    ]

    def __init__(self, *args, **kwargs):
        self.callable: Callable = kwargs["callable"]
        self.import_list: list[str] = kwargs.get("import_list", [])
        self.__add_default_imports_to_list(import_list=self.import_list)

    def build_tool(self, name: str | None = None) -> Image:
        if name is None:
            name = self.callable.class_name.lower() + ":latest"

        requirements = " ".join(self.import_list)

        return client.images.build(
            path=str(self.image_files.resolve()),
            tag=name.lower(),
            dockerfile=str(self.dockerfile.resolve()),
            buildargs={
                "PIP_REQUIREMENTS": requirements,
                "CALLABLE": obj_to_txt(self.callable),
            },
        )

    @classmethod
    def __add_default_imports_to_list(cls, import_list: list[str]):
        for lib in cls.default_imports:
            import_list.append(lib)


def get_image_by_name(image_name: str) -> Image | None:
    images = client.images.list(filters={"reference": f"{image_name.lower()}:latest"})
    if images:
        return images[0]
    return None
