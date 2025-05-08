from importlib.metadata import version
from importlib import import_module
from pathlib import Path

from langchain.tools.ddg_search import DuckDuckGoSearchRun

from run_tool import run_tool_in_container

import docker
from docker.models.images import Image

client = docker.from_env()


class LangchainToolDockerImageBuilder:
    dockerfile = Path("./docker_tools/langchain/Dockerfile.langchain")
    image_files = Path("./docker_tools/langchain/image_files/")

    default_imports = [
        "python-dotenv",
    ]

    def __init__(self, *args, **kwargs):
        self.tool_module_path: str = kwargs["tool_module_path"]  # requierd
        self.tool_class_name: str = kwargs["tool_class_name"]
        self.langchain_version = kwargs.get("langchain_version", version("langchain"))
        self.import_list: list[str] = kwargs.get("import_list", [])

        self.__add_default_imports_to_list(import_list=self.import_list)

    def build_tool(self, name: str | None = None) -> Image:
        if name is None:
            name = self.tool_class_name

        import_list = self.import_list
        import_list.append("langchain==" + self.langchain_version)
        requirements = " ".join(self.import_list)

        client.images.build(
            path=str(self.image_files.resolve()),
            tag=name.lower(),
            dockerfile=str(self.dockerfile.resolve()),
            buildargs={
                "PIP_REQUIREMENTS": requirements,
                "TOOL_MODULE_PATH": self.tool_module_path,
                "TOOL_CLASS_NAME": self.tool_class_name,
            },
        )

    def get_class(self) -> str:
        tool_module = import_module(self.tool_module_path)
        return getattr(tool_module, self.tool_class_name)

    def get_proxy_tool_class(self, image: Image | str | None = None):

        if image is None:
            image = f"{self.tool_class_name.lower()}:latest"

        class ProxyTool(self.get_class()):

            def _run(*args, **kwargs):
                return run_tool_in_container(image=image, tool_kwargs=kwargs)

        return ProxyTool

    @classmethod
    def __add_default_imports_to_list(cls, import_list: list[str]):
        import_list.append(*cls.default_imports)


if __name__ == "__main__":

    ltdl = LangchainToolDockerImageBuilder(
        tool_module_path="langchain.tools.ddg_search",
        tool_class_name="DuckDuckGoSearchRun",
        import_list=["duckduckgo-search"],
    )

    ltdl.build_tool("DuckDuckGoSearchRun")
