from enum import Enum
from build_langchain_tool import *
from docker.models.images import Image
from base_models import *


class ToolTypes(Enum):
    langchain = "langchain"
    other = "other"


def import_tool(import_tool_data: ImportToolData):
    dependencies = import_tool_data.dependencies
    force_build = import_tool_data.force_build

    if dependencies is None:
        dependencies = []

    ltdib = LangchainToolDockerImageBuilder(
        callable=import_tool_data.callable,
        import_list=dependencies,
    )

    image_name = import_tool_data.callable.class_name.lower()

    image: Image | None = get_image_by_name(image_name=image_name)  # optimize

    if force_build or not image:
        image = ltdib.build_tool(name=image_name)

    return ltdib.get_proxy_tool_class(image=image)


from langchain.tools.ddg_search import DuckDuckGoSearchRun

if __name__ == "__main__":
    td = ImportToolData(
        callable=Callable(
            module_path="langchain_community.tools.wikipedia.tool",
            class_name="WikipediaQueryRun",
            kwargs={
                "api_wrapper": Callable(
                    module_path="langchain_community.utilities.wikipedia",
                    class_name="WikipediaAPIWrapper",
                )
            },
        ),
        dependencies=["langchain-community", "wikipedia"],
        force_build=False,
    )

    tool_class = import_tool(td)

    tool = tool_class()
    output = tool._run(query="Love")

    print("\nHere's your output:\n\n" + output)


# ImportToolData(
#     callable=Callable(
#         module_path="langchain.tools.ddg_search",
#         class_name="DuckDuckGoSearchRun",

#     ),
#     dependencies=["duckduckgo-search"],
#     force_build=True,
# )
