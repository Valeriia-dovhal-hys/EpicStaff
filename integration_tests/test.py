import os
from requests import Response
import requests
import pytest
from time import sleep
import dotenv

dotenv.load_dotenv()
BASE_URL = "http://127.0.0.1:8000/api"


def repeat_request(
    method, url, max_wait_time=200, retry_interval=1, **kwargs
) -> Response:
    """
    Repeatedly sends an HTTP request of a specified method to the specified URL
    until the maximum wait time is reached.

    Args:
        method (str): The HTTP method to use for the request (e.g., 'GET', 'POST', 'PUT').
        url (str): The URL to send the request to.
        max_wait_time (int): The maximum time to keep trying the request (in seconds).
        retry_interval (int): The time between each retry (in seconds).
        **kwargs: Additional arguments passed to the requests function (e.g., json, data, headers).

    Returns:
        Response: The final response object from the request, if successful.

    Raises:
        TimeoutError: If the maximum wait time is reached and no success.
    """
    total_wait_time = 0
    while total_wait_time < max_wait_time:
        try:
            # Dynamically call the appropriate requests method (GET, POST, PUT, etc.)
            response = getattr(requests, method.lower())(url, **kwargs)
            response.raise_for_status()  # Will raise an HTTPError for bad responses (4xx or 5xx)
            return response  # If the request is successful, return the response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}. Retrying in {retry_interval} seconds...")
            sleep(retry_interval)  # Wait before retrying
            total_wait_time += retry_interval  # Accumulate the wait time

    raise TimeoutError(f"Request failed after {max_wait_time} seconds.")


def test_create_and_run_crew():

    config_id = create_config()

    llm_id = 1

    set_openai_api_key_to_environment()

    wikipedia_tool_id = get_tool("wikipedia")

    wikipedia_agent_id = create_agent(
        tool_id_list=[wikipedia_tool_id], llm_id=llm_id, config_id=config_id
    )

    crew_id = create_crew(
        agent_id_list=[wikipedia_agent_id], llm_id=llm_id, config_id=config_id
    )

    session_id = run_session(crew_id=crew_id)

    print(f"Session with id {session_id} created, yay!")


def run_session(crew_id: int):
    run_data = {"crew_id": crew_id}
    run_crew_response = repeat_request(
        "post", f"{BASE_URL}/run-session/", json=run_data
    )

    return run_crew_response.json()["session_id"]


def create_crew(agent_id_list: list[int], llm_id: int, config_id: int) -> int:

    crew_data = {
        "name": "Integratin test crew",
        "agents": agent_id_list,
        "process": "sequential",
        "memory": False,
        "embedding_model": None,
        "manager_llm_model": llm_id,
        "manager_llm_config": config_id,
    }

    crew_response = repeat_request("post", f"{BASE_URL}/crews/", json=crew_data)

    return crew_response.json()["id"]


def create_agent(
    tool_id_list: list[int],
    llm_id: int,
    config_id: int,
) -> int:
    agent_data = {
        "tools": tool_id_list,
        "role": "wikipedia_searcher",
        "goal": "search information in wikipedia",
        "backstory": "You are the agent who use tools to perform tasks",
        "allow_delegation": False,
        "memory": False,
        "max_iter": 15,
        "llm_model": llm_id,
        "fcm_llm_model": llm_id,
        "llm_config": config_id,
        "fcm_llm_config": config_id,
    }

    agent_response = repeat_request("post", f"{BASE_URL}/agents/", json=agent_data)

    return agent_response.json()["id"]


def create_config() -> int:
    config_llm_data = {"temperature": 0, "num_ctx": 25}

    config_llm_response = repeat_request(
        "post", f"{BASE_URL}/config-llm/", json=config_llm_data
    )

    return config_llm_response.json()["id"]


def set_openai_api_key_to_environment() -> None:
    SECRET_OPENAI_API_KEY = os.environ.get("OPENAI_KEY", "No key")

    environment_data = {"data": {"SECRET_OPENAI_API_KEY": SECRET_OPENAI_API_KEY}}

    repeat_request("post", f"{BASE_URL}/environment/config/", json=environment_data)


def get_tool(tool_alias: str) -> int:
    response_tools = repeat_request("post", f"{BASE_URL}/tools/")

    tool_list = response_tools.json()["result"]

    wikipedia_tool = filter(lambda tool: tool.name_alias == tool_alias, tool_list)

    return next(wikipedia_tool)["id"]
