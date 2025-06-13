import os
import sys
from requests import Response
import requests
import time
from time import sleep
import dotenv
import docker
from loguru import logger

dotenv.load_dotenv()
BASE_URL = "http://127.0.0.1:8000/api"
MAX_SESSION_EXECUTION_TIME_SECONDS = 600
container_name_list = ["manager_container", "redis", "crewdb", "django_app", "frontend"]
client = docker.from_env()

logger.remove()
logger.add(sink=sys.stdout, level="DEBUG")


def is_container_running(container_name: str) -> bool:
    """
    Checks if a Docker container is alive (running) by its name or ID.

    Args:
        container_name (str): The name or ID of the Docker container.

    Returns:
        bool: True if the container is running, False otherwise.
    """

    try:
        container = client.containers.get(container_name)
        # Check if the container status is 'running'
        return container.status == "running"
    except docker.errors.NotFound:
        logger.error(f"Container '{container_name}' not found.")
        log_container(container_name=container_name)
        return False
    except docker.errors.APIError as e:
        logger.error(f"Error connecting to Docker API: {e}")
        return False


def repeat_request(
    method, url, max_wait_time=200, retry_interval=1, **kwargs
) -> Response:
    """
    Repeatedly sends an HTTP request of a specified method to the specified URL
    until the maximum wait time is reached.
    """

    logger.debug(f"method: {method}, url: {url}")

    total_wait_time = 0
    while total_wait_time < max_wait_time:
        try:
            response = getattr(requests, method.lower())(url, **kwargs)
            response.raise_for_status()
            return response
        except requests.exceptions.HTTPError as e:
            if response.status_code >= 500:
                logger.warning(
                    f"Server error: {e}. Retrying in {retry_interval} seconds..."
                )
            elif response.status_code == 404:
                logger.error("Resource not found.")
                assert False, f"Resource not found at {url}"
            else:
                logger.warning(
                    f"Request failed: {e}. Retrying in {retry_interval} seconds..."
                )
        except requests.exceptions.RequestException as e:
            logger.warning(
                f"Request failed: {e}. Retrying in {retry_interval} seconds..."
            )

        sleep(retry_interval)
        total_wait_time += retry_interval

    logger.error(f"Request failed after {max_wait_time} seconds.")
    raise TimeoutError(f"Request failed after {max_wait_time} seconds.")


def test_create_and_run_crew():

    sleep(20) # sleep to make sure that predifined models uploaded
    
    set_openai_api_key_to_environment()

    config_id = create_config()

    llm_id = 1

    wikipedia_tool_id = get_tool("wikipedia")

    wikipedia_agent_id = create_agent(
        tool_id_list=[wikipedia_tool_id], llm_id=llm_id, config_id=config_id
    )

    crew_id = create_crew(
        agent_id_list=[wikipedia_agent_id], llm_id=llm_id, config_id=config_id
    )

    session_id = run_session(crew_id=crew_id)

    logger.success(f"Session with id {session_id} created, yay!")

    wait_for_results(session_id=session_id)


def wait_for_results(session_id: int):
    start_time = time.time()
    while True:
        if time.time() - start_time > MAX_SESSION_EXECUTION_TIME_SECONDS:
            raise TimeoutError()
        check_containers()
        status = get_session_status(session_id=session_id)

        if status == "error":
            logger.error(f"Session status is {status}")
            log_container(f"crew_session-{session_id}")
            assert False, f"Session status is {status}"

        if status == "end":
            break

        time.sleep(2)
    session_message_list = get_session_messages(session_id=session_id)
    logger.info(f"Messages: \n{session_message_list}")
    assert len(session_message_list) != 0


def log_container(container_name: str):
    container = client.containers.get(container_name)
    logs = container.logs(timestamps=True).decode("utf-8")

    logger.info(f"{container_name} logs\n{logs}")


def check_containers():
    for name in container_name_list:
        running = is_container_running(container_name=name)
        if not running:
            logger.error(f'Container "{name}" not running')
            assert False, f'Container "{name}" not running'


def get_session_messages(session_id: int) -> list:
    session_response = repeat_request(
        "get", f"{BASE_URL}/sessions/{session_id}/messages"
    )
    return session_response.json()["results"]


def get_session_status(session_id: int) -> str:
    session_response = repeat_request("get", f"{BASE_URL}/sessions/{session_id}/")
    return session_response.json()["status"]


def run_session(crew_id: int):
    run_data = {"crew_id": crew_id}
    run_crew_response = repeat_request(
        "post", f"{BASE_URL}/run-session/", json=run_data
    )

    return run_crew_response.json()["session_id"]


def create_task(crew_id: int, agent_id: int):
    task_data = {
        "name": "Test task",
        "instructions": "Find inpormation about cars",
        "expected_output": "What is car",
        "order": 1,
        "crew": crew_id,
        "agent": agent_id,
    }

    crew_response = repeat_request("post", f"{BASE_URL}/tasks/", json=task_data)


def create_crew(agent_id_list: list, llm_id: int, config_id: int) -> int:

    crew_data = {
        "name": "Integratin test crew",
        "assignment": "",
        "agents": agent_id_list,
        "process": "sequential",
        "memory": False,
        "embedding_model": None,
        "manager_llm_model": llm_id,
        "manager_llm_config": config_id,
    }

    crew_response = repeat_request("post", f"{BASE_URL}/crews/", json=crew_data)
    crew_id = crew_response.json()["id"]
    create_task(crew_id=crew_id, agent_id=agent_id_list[0])

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
    SECRET_OPENAI_API_KEY = os.environ.get("OPENAI_KEY", None)

    if SECRET_OPENAI_API_KEY is None:

        logger.error("OPENAI_KEY not provided")
        assert False, "OPENAI_KEY not provided"

    environment_data = {"data": {"SECRET_OPENAI_API_KEY": SECRET_OPENAI_API_KEY}}

    repeat_request("post", f"{BASE_URL}/environment/config", json=environment_data)


def get_tool(tool_alias: str) -> int:
    response_tools = repeat_request("get", f"{BASE_URL}/tools/")

    tool_list = response_tools.json()["results"]

    wikipedia_tool = filter(lambda tool: tool["name_alias"] == tool_alias, tool_list)

    return next(wikipedia_tool)["id"]
