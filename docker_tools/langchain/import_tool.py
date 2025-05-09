from enum import Enum
from crewai.agent import Agent
from crewai.crew import Crew
from crewai.task import Task
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
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


# def create_llm():
#     load_dotenv()
#     # os.environ["OPENAI_API_KEY"] = os.environ.get("SECRET_OPENAI_API_KEY")

#     return ChatOpenAI(
#         model_name="gpt-4-turbo-preview",
#         temperature=0.8,
#         # provider="openai",
#         base_url="https://api.openai.com/v1",
#     )


# def create_crew(proxy_tool_list: list) -> Crew:

#     agent1 = Agent(
#         role="agent role",
#         goal="who is {input}?",
#         backstory="agent backstory",
#         verbose=True,
#         tools=proxy_tool_list,
#         llm=create_llm(),
#     )

#     task1 = Task(
#         expected_output="a short biography of {input}",
#         description="a short biography of {input}",
#         agent=agent1,
#     )
#     return Crew(agents=[agent1], tasks=[task1])


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

    # crew = create_crew([tool_class()])

    # crew.kickoff(inputs={"input": "Mark Twain"})

    # output = tool._run(query="Love")

    # print("\nHere's your output:\n\n" + output)


# ImportToolData(
#     callable=Callable(
#         module_path="langchain.tools.ddg_search",
#         class_name="DuckDuckGoSearchRun",

#     ),
#     dependencies=["duckduckgo-search"],
#     force_build=True,
# )
