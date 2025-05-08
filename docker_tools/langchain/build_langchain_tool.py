from importlib.metadata import version
from importlib import import_module
from pathlib import Path
from json import dumps
from typing import Any
from langchain.tools.ddg_search import DuckDuckGoSearchRun


import docker
from docker.models.images import Image

from base_models import Callable
from pickle_encode import obj_to_txt

client = docker.from_env()


class LangchainToolDockerImageBuilder:
    dockerfile = Path("./docker_tools/langchain/Dockerfile.langchain")
    image_files = Path("./docker_tools/langchain/image_files/")

    default_imports = [
        "python-dotenv",
        "pydantic",
    ]

    def __init__(self, *args, **kwargs):
        self.callable: Callable = kwargs["callable"]
        self.langchain_version = kwargs.get("langchain_version", version("langchain"))
        self.import_list: list[str] = kwargs.get("import_list", [])

        self.__add_default_imports_to_list(import_list=self.import_list)

    def build_tool(self, name: str | None = None) -> Image:
        if name is None:
            name = self.callable.class_name

        import_list = self.import_list
        import_list.append("langchain==" + self.langchain_version)
        requirements = " ".join(self.import_list)

        client.images.build(
            path=str(self.image_files.resolve()),
            tag=name.lower(),
            dockerfile=str(self.dockerfile.resolve()),
            buildargs={
                "PIP_REQUIREMENTS": requirements,
                "CALLABLE": obj_to_txt(self.callable),
            },
        )

    def get_class(self) -> str:
        tool_module = import_module(self.callable.module_path)
        return getattr(tool_module, self.callable.class_name)

    def get_proxy_tool_class(self, image: Image | str | None = None):

        if image is None:
            image = f"{self.callable.class_name.lower()}:latest"
        class_ = self.get_class()

        class ProxyTool:
            # TODO: get all attributes
            # name = class_.name
            # description = class_.description
            # args_schema = class_.args_schema

            def _run(self, *args, **kwargs):
                run_params = (args, kwargs)
                return run_tool_in_container(image=image, run_params=run_params)

        # ProxyTool.__dir__ = class_.__dir__

        return ProxyTool

    @classmethod
    def __add_default_imports_to_list(cls, import_list: list[str]):
        for lib in cls.default_imports:
            import_list.append(lib)


def get_image_by_name(image_name: str) -> Image | None:
    images = client.images.list(filters={"reference": f"{image_name.lower()}:latest"})
    if images:
        return images[0]
    return None


def run_tool_in_container(
    *, image: Image | str, run_params: tuple[tuple, dict[str, Any]] | None = None
) -> str:

    enviroment = dict()

    enviroment["TOOL_RUN_PARAMS"] = obj_to_txt(run_params)

    byte_out = client.containers.run(image=image, environment=enviroment)
    return byte_out.decode("utf-8")

