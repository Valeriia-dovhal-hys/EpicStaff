from importlib.metadata import version
from importlib import import_module
from pathlib import Path
from json import dumps
from typing import Any


import docker
from docker.models.images import Image

from services.base_models import Callable
from services.pickle_encode import obj_to_txt

client = docker.from_env()


class ToolDockerImageBuilder:
    dockerfile = Path("./tool/Dockerfile.tool")
    image_files = Path("./tool")

    default_imports = [
        "python-dotenv",
        "pydantic",
        "fastapi[all]",
    ]

    def __init__(
        self, tool_dict: dict[str, Callable], import_list: list[str] | None = None
    ):

        self.tool_dict: dict[str, Callable] = tool_dict
        self.import_list: list[str] = import_list if import_list is not None else list()
        self.__add_default_imports_to_list(import_list=self.import_list)

    def build_tool_image(self, image_name: str | None = None) -> Image:

        requirements = " ".join(self.import_list)

        return client.images.build(
            path=str(self.image_files.resolve()),
            tag=image_name,
            dockerfile=str(self.dockerfile.resolve()),
            buildargs={
                "PIP_REQUIREMENTS": requirements,
                "ALIAS_CALLABLE": obj_to_txt(self.tool_dict),
            },
        )[0]

    @classmethod
    def __add_default_imports_to_list(cls, import_list: list[str]):
        for lib in cls.default_imports:
            import_list.append(lib)


def get_image_by_name(image_name: str) -> Image | None:
    images = client.images.list(filters={"reference": f"{image_name.lower()}:latest"})
    if images:
        return images[0]
    return None
