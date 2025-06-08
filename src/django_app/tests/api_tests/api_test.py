import pytest
from django.urls import reverse
from tables.models import (
    ConfigLLM,
    Provider,
    LLMModel,
    EmbeddingModel,
    Tool,
    Agent,
    TemplateAgent,
    Task,
    Crew,
    Session,
)
from rest_framework import status

from tests.fixtures import *


@pytest.mark.django_db
def test_create_config_llm(api_client):
    url = reverse("configllm-list")
    data = {"temperature": 0.9, "num_ctx": 30}

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert ConfigLLM.objects.count() == 1
    assert ConfigLLM.objects.first().temperature == 0.9


@pytest.mark.django_db
def test_create_provider(api_client):
    url = reverse("provider-list")
    data = {"name": "new_provider"}

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Provider.objects.count() == 1
    assert Provider.objects.first().name == "new_provider"


@pytest.mark.django_db
def test_create_llm_model(api_client, openai_provider):
    url = reverse("llmmodel-list")
    data = {
        "name": "model_x",
        "description": "Test model",
        "llm_provider": openai_provider.pk,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert LLMModel.objects.count() == 1
    assert LLMModel.objects.first().name == "model_x"


@pytest.mark.django_db
def test_create_embedding_model(api_client, openai_provider):
    url = reverse("embeddingmodel-list")
    data = {
        "name": "embedding_model_y",
        "embedding_provider": openai_provider.pk,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert EmbeddingModel.objects.count() == 1
    assert EmbeddingModel.objects.first().name == "embedding_model_y"


@pytest.mark.django_db
def test_create_tool(api_client, gpt_4o_llm, llm_config):
    url = reverse("tool-list")
    data = {
        "name": "tool_z",
        "name_alias": "Tool Z",
        "description": "Tool description",
        "requires_model": False,
        "llm_model": gpt_4o_llm.pk,
        "llm_config": llm_config.pk,
        "enabled": True,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Tool.objects.count() == 1
    assert Tool.objects.first().name == "tool_z"


@pytest.mark.django_db
def test_create_agent(api_client, gpt_4o_llm, llm_config, wikipedia_tool):
    url = reverse("agent-list")
    data = {
        "role": "test_agent",
        "goal": "test_goal",
        "backstory": "test_backstory",
        "allow_delegation": True,
        "memory": True,
        "max_iter": 10,
        "llm_model": gpt_4o_llm.pk,
        "llm_config": llm_config.pk,
        "tools": [wikipedia_tool.pk],
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Agent.objects.count() == 1
    assert Agent.objects.first().role == "test_agent"


@pytest.mark.django_db
def test_create_template_agent(api_client, gpt_4o_llm, llm_config, wikipedia_tool):
    url = reverse("templateagent-list")
    data = {
        "role": "template_agent",
        "goal": "test_goal",
        "backstory": "test_backstory",
        "allow_delegation": True,
        "memory": True,
        "max_iter": 10,
        "llm_model": gpt_4o_llm.pk,
        "llm_config": llm_config.pk,
        "tools": [wikipedia_tool.pk],
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert TemplateAgent.objects.count() == 1
    assert TemplateAgent.objects.first().role == "template_agent"


@pytest.mark.django_db
def test_create_crew(
    api_client, wikipedia_agent, embedding_model, gpt_4o_llm, llm_config
):
    url = reverse("crew-list")
    data = {
        "name": "Test Crew",
        "description": "A test crew",
        "assignment": "Test assignment",
        "process": "sequential",
        "memory": True,
        "embedding_model": embedding_model.pk,
        "manager_llm_model": gpt_4o_llm.pk,
        "manager_llm_config": llm_config.pk,
        "agents": [wikipedia_agent.pk],
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Crew.objects.count() == 1
    assert Crew.objects.first().name == "Test Crew"


@pytest.mark.django_db
def test_create_task(api_client, crew, wikipedia_agent):
    url = reverse("task-list")
    data = {
        "name": "task_x",
        "crew": crew.pk,
        "agent": wikipedia_agent.pk,
        "instructions": "Complete this task",
        "expected_output": "Expected result",
        "order": 1,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Task.objects.count() == 1
    assert Task.objects.first().name == "task_x"


@pytest.mark.django_db
def test_create_session(api_client, crew):
    url = reverse("session-list")
    data = {"crew": crew.pk, "status": "run"}

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert Session.objects.count() == 0


@pytest.mark.django_db
def test_get_agents_empty(api_client):
    url = reverse("agent-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_agents_with_data(api_client, wikipedia_agent):
    url = reverse("agent-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["role"] == wikipedia_agent.role


@pytest.mark.django_db
def test_get_config_llms_empty(api_client):
    url = reverse("configllm-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_config_llms_with_data(api_client, llm_config):
    url = reverse("configllm-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["temperature"] == llm_config.temperature


@pytest.mark.django_db
def test_get_providers_empty(api_client):
    url = reverse("provider-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_providers_with_data(api_client, openai_provider):
    url = reverse("provider-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["name"] == openai_provider.name


@pytest.mark.django_db
def test_get_llm_models_empty(api_client):
    url = reverse("llmmodel-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_llm_models_with_data(api_client, gpt_4o_llm):
    url = reverse("llmmodel-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["name"] == gpt_4o_llm.name


@pytest.mark.django_db
def test_get_embedding_models_empty(api_client):
    url = reverse("embeddingmodel-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_embedding_models_with_data(api_client, embedding_model):
    url = reverse("embeddingmodel-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["name"] == embedding_model.name


@pytest.mark.django_db
def test_get_tools_empty(api_client):
    url = reverse("tool-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_tools_with_data(api_client, wikipedia_tool):
    url = reverse("tool-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["name"] == wikipedia_tool.name


@pytest.mark.django_db
def test_get_crews_empty(api_client):
    url = reverse("crew-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_crews_with_data(api_client, crew):
    url = reverse("crew-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["name"] == crew.name


@pytest.mark.django_db
def test_get_tasks_empty(api_client):
    url = reverse("task-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_tasks_with_data(api_client, crew, wikipedia_agent):
    # First create a task
    task_url = reverse("task-list")
    task_data = {
        "name": "test_task",
        "crew": crew.pk,
        "agent": wikipedia_agent.pk,
        "instructions": "Complete the test task",
        "expected_output": "Expected output",
        "order": 1,
    }
    api_client.post(task_url, task_data, format="json")

    # Now retrieve all tasks
    url = reverse("task-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["name"] == "test_task"


@pytest.mark.django_db
def test_get_sessions_empty(api_client):
    url = reverse("session-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.django_db
def test_get_sessions_with_data(api_client, crew, redis_client_mock):
    # First create a session using run-session endpoint
    data = {"crew_id": crew.pk}
    url = reverse("run-session")

    response = api_client.post(url, data, format="json")

    # Now retrieve all sessions
    url = reverse("session-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["crew"] == crew.pk


# =====================================


@pytest.mark.django_db
def test_get_agent_by_id(api_client, wikipedia_agent):
    url = reverse("agent-detail", args=[wikipedia_agent.pk])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["role"] == wikipedia_agent.role


@pytest.mark.django_db
def test_get_agent_by_invalid_id(api_client):
    url = reverse("agent-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_config_llm_by_id(api_client, llm_config):
    url = reverse("configllm-detail", args=[llm_config.pk])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["temperature"] == llm_config.temperature


@pytest.mark.django_db
def test_get_config_llm_by_invalid_id(api_client):
    url = reverse("configllm-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_provider_by_id(api_client, openai_provider):
    url = reverse("provider-detail", args=[openai_provider.pk])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == openai_provider.name


@pytest.mark.django_db
def test_get_provider_by_invalid_id(api_client):
    url = reverse("provider-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_llm_model_by_id(api_client, gpt_4o_llm):
    url = reverse("llmmodel-detail", args=[gpt_4o_llm.pk])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == gpt_4o_llm.name


@pytest.mark.django_db
def test_get_llm_model_by_invalid_id(api_client):
    url = reverse("llmmodel-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_embedding_model_by_id(api_client, embedding_model):
    url = reverse("embeddingmodel-detail", args=[embedding_model.pk])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == embedding_model.name


@pytest.mark.django_db
def test_get_embedding_model_by_invalid_id(api_client):
    url = reverse("embeddingmodel-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_tool_by_id(api_client, wikipedia_tool):
    url = reverse("tool-detail", args=[wikipedia_tool.pk])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == wikipedia_tool.name


@pytest.mark.django_db
def test_get_tool_by_invalid_id(api_client):
    url = reverse("tool-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_crew_by_id(api_client, crew):
    url = reverse("crew-detail", args=[crew.pk])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == crew.name


@pytest.mark.django_db
def test_get_crew_by_invalid_id(api_client):
    url = reverse("crew-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_task_by_id(api_client, crew, wikipedia_agent):
    # First create a task to retrieve
    task_url = reverse("task-list")
    task_data = {
        "name": "test_task",
        "crew": crew.pk,
        "agent": wikipedia_agent.pk,
        "instructions": "Complete the test task",
        "expected_output": "Expected output",
        "order": 1,
    }
    task_response = api_client.post(task_url, task_data, format="json")
    task_id = task_response.data["id"]

    # Now retrieve the task by ID
    url = reverse("task-detail", args=[task_id])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == "test_task"


@pytest.mark.django_db
def test_get_task_by_invalid_id(api_client):
    url = reverse("task-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_session_by_id(api_client, crew, redis_client_mock):
    # First create a session to retrieve
    data = {"crew_id": crew.pk}
    url = reverse("run-session")
    api_client.post(url, data, format="json")

    # Now retrieve all sessions to get the created session's ID
    session_url = reverse("session-list")
    session_response = api_client.get(session_url)
    session_id = session_response.data["results"][0]["id"]

    # Now retrieve the session by ID
    url = reverse("session-detail", args=[session_id])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["crew"] == crew.pk


@pytest.mark.django_db
def test_get_session_by_invalid_id(api_client):
    url = reverse("session-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


# =====================================


@pytest.mark.django_db
def test_update_agent(api_client, wikipedia_agent):
    url = reverse("agent-detail", args=[wikipedia_agent.pk])
    updated_data = {
        "role": "Updated Role",
        "goal": "Updated goal",
        "backstory": "Updated backstory",
        "allow_delegation": False,
        "memory": False,
        "max_iter": 1,
        "llm_model": None,
        "fcm_llm_model": None,
        "llm_config": None,
        "fcm_llm_config": None,
    }

    response = api_client.put(url, updated_data, format="json")
    assert response.status_code == status.HTTP_200_OK

    wikipedia_agent.refresh_from_db()

    # Dynamically assert each field to match updated_data
    for field, value in updated_data.items():
        assert getattr(wikipedia_agent, field) == value


@pytest.mark.django_db
def test_update_agent_invalid_id(api_client):
    url = reverse("agent-detail", args=[999])
    updated_data = {
        "role": "Updated Role",
        "goal": "Updated goal",
        "backstory": "Updated backstory",
        "allow_delegation": False,
        "memory": False,
        "max_iter": 1,
        "llm_model": None,
        "fcm_llm_model": None,
        "llm_config": None,
        "fcm_llm_config": None,
    }
    response = api_client.put(url, updated_data, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_update_config_llm(api_client, llm_config):
    url = reverse("configllm-detail", args=[llm_config.pk])
    updated_data = {
        "temperature": 0.9,
        "num_ctx": 50,
    }

    response = api_client.put(url, updated_data, format="json")
    assert response.status_code == status.HTTP_200_OK

    llm_config.refresh_from_db()

    for field, value in updated_data.items():
        assert getattr(llm_config, field) == value

@pytest.mark.django_db
def test_update_config_llm_invalid_id(api_client):
    url = reverse("configllm-detail", args=[999])
    updated_data = {
        "temperature": 0.9,
        "num_ctx": 50,
    }

    response = api_client.put(url, updated_data, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_update_provider(api_client, openai_provider):
    url = reverse("provider-detail", args=[openai_provider.pk])
    updated_data = {"name": "Updated Provider"}

    response = api_client.put(url, updated_data, format="json")

    assert response.status_code == status.HTTP_200_OK
    openai_provider.refresh_from_db()
    assert openai_provider.name == updated_data["name"]


@pytest.mark.django_db
def test_update_provider_invalid_id(api_client):
    url = reverse("provider-detail", args=[999])
    updated_data = {"name": "Updated Provider"}

    response = api_client.put(url, updated_data, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_update_llm_model(api_client, gpt_4o_llm):
    url = reverse("llmmodel-detail", args=[gpt_4o_llm.pk])
    updated_data = {
        "name": "Updated LLM Name",
        "llm_provider": gpt_4o_llm.llm_provider.pk,
    }

    response = api_client.put(url, updated_data, format="json")
    assert response.status_code == status.HTTP_200_OK

    gpt_4o_llm.refresh_from_db()

    assert gpt_4o_llm.name == updated_data["name"]
    assert gpt_4o_llm.llm_provider.pk == updated_data["llm_provider"]



@pytest.mark.django_db
def test_update_llm_model_invalid_id(api_client, gpt_4o_llm):
    url = reverse("llmmodel-detail", args=[999])
    updated_data = {
        "name": "Updated LLM Name",
        "llm_provider": gpt_4o_llm.llm_provider.pk,
    }

    response = api_client.put(url, updated_data, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND


# @pytest.mark.django_db
# def test_update_embedding_model(api_client, embedding_model):
#     url = reverse("embeddingmodel-detail", args=[embedding_model.pk])
#     updated_data = {"name": "Updated Embedding Model"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_200_OK
#     embedding_model.refresh_from_db()
#     assert embedding_model.name == updated_data["name"]


# @pytest.mark.django_db
# def test_update_embedding_model_invalid_id(api_client):
#     url = reverse("embeddingmodel-detail", args=[999])
#     updated_data = {"name": "Updated Embedding Model"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_404_NOT_FOUND


# @pytest.mark.django_db
# def test_update_tool(api_client, wikipedia_tool):
#     url = reverse("tool-detail", args=[wikipedia_tool.pk])
#     updated_data = {"name": "Updated Tool"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_200_OK
#     wikipedia_tool.refresh_from_db()
#     assert wikipedia_tool.name == updated_data["name"]


# @pytest.mark.django_db
# def test_update_tool_invalid_id(api_client):
#     url = reverse("tool-detail", args=[999])
#     updated_data = {"name": "Updated Tool"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_404_NOT_FOUND


# @pytest.mark.django_db
# def test_update_crew(api_client, crew):
#     url = reverse("crew-detail", args=[crew.pk])
#     updated_data = {"name": "Updated Crew"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_200_OK
#     crew.refresh_from_db()
#     assert crew.name == updated_data["name"]


# @pytest.mark.django_db
# def test_update_crew_invalid_id(api_client):
#     url = reverse("crew-detail", args=[999])
#     updated_data = {"name": "Updated Crew"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_404_NOT_FOUND


# @pytest.mark.django_db
# def test_update_task(api_client, crew, wikipedia_agent):
#     # First create a task to update
#     task_url = reverse("task-list")
#     task_data = {
#         "name": "test_task",
#         "crew": crew.pk,
#         "agent": wikipedia_agent.pk,
#         "instructions": "Complete the test task",
#         "expected_output": "Expected output",
#         "order": 1,
#     }
#     task_response = api_client.post(task_url, task_data, format="json")
#     task_id = task_response.data["id"]

#     # Now update the task
#     url = reverse("task-detail", args=[task_id])
#     updated_data = {"name": "Updated Task"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_200_OK
#     task_response.refresh_from_db()
#     assert task_response.name == updated_data["name"]


# @pytest.mark.django_db
# def test_update_task_invalid_id(api_client):
#     url = reverse("task-detail", args=[999])
#     updated_data = {"name": "Updated Task"}

#     response = api_client.put(url, updated_data, format="json")

#     assert response.status_code == status.HTTP_404_NOT_FOUND
