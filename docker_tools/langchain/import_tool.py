from enum import Enum
from build_langchain_tool import *
from docker.models.images import Image

client = docker.from_env()


class ToolTypes(Enum):
    langchain = "langchain"
    other = "other"


def get_image_by_name(image_name: str) -> Image | None:
    images = client.images.list(filters={"reference": f"{image_name.lower()}:latest"})
    if images:
        return images[0]
    return None


def import_tool(
    tool_type: ToolTypes,
    tool_module_path: str,
    tool_class_name: str,
    dependencies: list[str] | None = None,
    force_build=False,
):

    if tool_type == ToolTypes.other:
        return

    if dependencies is None:
        dependencies = []

    if tool_type == ToolTypes.langchain:
        ltdib = create_langchain_builder(
            tool_module_path=tool_module_path,
            tool_class_name=tool_class_name,
            dependencies=dependencies,
        )
        image: Image | None = get_image_by_name(image_name=tool_class_name)  # optimize

        if force_build or not image:
            image = ltdib.build_tool(name=tool_class_name)

        return ltdib.get_proxy_tool_class(image=image)


def create_langchain_builder(
    tool_module_path: str, tool_class_name: str, dependencies: list[str]
):

    return LangchainToolDockerImageBuilder(
        tool_module_path=tool_module_path,
        tool_class_name=tool_class_name,
        import_list=dependencies,
    )


if __name__ == "__main__":
    tool_class = import_tool(
        tool_type=ToolTypes.langchain,
        tool_module_path="langchain.tools.ddg_search",
        tool_class_name="DuckDuckGoSearchRun",
        dependencies=["duckduckgo-search"],
    )

    output = tool_class()._run(query="wise men say")
    print("\nHere's your output:\n\n" + output)
