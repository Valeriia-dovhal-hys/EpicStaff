import requests
import pytest
from time import sleep



BASE_URL = "http://localhost:8000/api"


@pytest.fixture
def openai_provider():
    sleep(180)

    url = f"{BASE_URL}/providers/"
    data = {"name": "openai"}
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()  # Return the JSON response with the created provider data


@pytest.fixture
def gpt_4o_llm(openai_provider):
    url = f"{BASE_URL}/llmmodels/"
    data = {
        "name": "gpt-4o",
        "llm_provider": openai_provider["id"]  # Link to the created provider
    }
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()


@pytest.fixture
def llm_config():
    url = f"{BASE_URL}/configllms/"
    data = {
        "temperature": 0.5,
        "num_ctx": 25
    }
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()


@pytest.fixture
def wikipedia_tool():
    url = f"{BASE_URL}/tools/"
    data = {
        "name": "Wikipedia",
        "name_alias": "wikipedia",
        "description": "Tool to search in wikipedia",
        "requires_model": False
    }
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()


@pytest.fixture
def wikipedia_agent(gpt_4o_llm, llm_config, wikipedia_tool):
    url = f"{BASE_URL}/agents/"
    data = {
        "role": "Wikipedia searcher",
        "goal": "Search in wikipedia and give short summary on what you found",
        "backstory": "You are an experienced wikipedia user",
        "allow_delegation": True,
        "memory": True,
        "max_iter": 25,
        "llm_model": gpt_4o_llm["id"],
        "llm_config": llm_config["id"],
        "fcm_llm_model": gpt_4o_llm["id"],
        "fcm_llm_config": llm_config["id"],
        "tools": [wikipedia_tool["id"]]  # Assign the tool by ID
    }
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()


@pytest.fixture
def embedding_model(openai_provider):
    url = f"{BASE_URL}/embeddingmodels/"
    data = {
        "name": "text-embedding-3-small",
        "embedding_provider": openai_provider["id"]
    }
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()


@pytest.fixture
def test_task(wikipedia_agent):
    url = f"{BASE_URL}/tasks/"
    data = {
        "name": "test task",
        "agent": wikipedia_agent["id"],
        "instructions": "some instructions",
        "expected_output": "some output",
        "order": 1
    }
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()


@pytest.fixture
def crew(wikipedia_agent, embedding_model, gpt_4o_llm, llm_config, test_task):
    url = f"{BASE_URL}/crews/"
    data = {
        "name": "Test Crew",
        "description": "crew for tests",
        "assignment": "Give best results",
        "process": "sequential",
        "memory": True,
        "embedding_model": embedding_model["id"],
        "manager_llm_model": gpt_4o_llm["id"],
        "manager_llm_config": llm_config["id"],
        "agents": [wikipedia_agent["id"]]  # Link agents by ID
    }
    response = requests.post(url, json=data)
    response.raise_for_status()

    # Assign crew to the task (update task with crew info)
    task_url = f"{BASE_URL}/tasks/{test_task['id']}/"
    task_data = {"crew": response.json()["id"]}
    requests.patch(task_url, json=task_data)

    return response.json()



def test_create_crew(crew):
    print(crew)
