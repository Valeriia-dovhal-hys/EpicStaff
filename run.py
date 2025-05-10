from crewai.agent import Agent
from crewai.crew import Crew
from crewai.task import Task
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from base_models import Callable, ImportToolData
from docker_tools.import_tool import import_tools


def create_llm():
    load_dotenv()

    return ChatOpenAI(
        model_name="gpt-4-turbo-preview",
        temperature=0.8,
        # provider="openai",
        base_url="https://api.openai.com/v1",
    )


def create_crew(proxy_tool_list: list) -> Crew:

    agent1 = Agent(
        role="agent role",
        goal="who is {input}?",
        backstory="agent backstory",
        verbose=True,
        tools=proxy_tool_list,
        llm=create_llm(),
    )

    task1 = Task(
        expected_output="a short biography of {input}, 5 main facts list",
        description="a short biography of {input}",
        agent=agent1,
    )
    return Crew(agents=[agent1], tasks=[task1])


def main():
    td = ImportToolData(
        image_name="group1",
        tool_dict={
            "wikipedia_tool": Callable(
                module_path="langchain_community.tools.wikipedia.tool",  # Might not exist
                class_name="WikipediaQueryRun",
                kwargs={
                    "api_wrapper": Callable(
                        # module_path="langchain_community.utilities.wikipedia",  # Might not exist
                        class_name="WikipediaAPIWrapper",
                        package="langchain_community",
                    )
                },
            )
        },
        dependencies=["langchain-community", "wikipedia", "langchain"],
        force_build=True,
    )

    tool_class = import_tools(td)

    tool = tool_class["wikipedia_tool"]()

    crew = create_crew([tool])

    crew.kickoff(inputs={"input": "Mark Twain"})


if __name__ == "__main__":
    main()
