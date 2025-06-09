import pytest
from django.urls import reverse
from tables.models import Session
from tests.fixtures import *


@pytest.mark.django_db
def test_run_session(crew, api_client, redis_client_mock):

    url = reverse("run-session")
    data = {"crew_id": crew.pk}

    response = api_client.post(url, data, format="json")

    response_session_id: int = response.data["session_id"]
    session = Session.objects.get(pk=response_session_id)

    assert session.crew.pk == crew.pk


@pytest.mark.django_db
def test_publish_start_session(crew, test_task, api_client, redis_client_mock):

    # add test task to crew
    test_task.crew = crew
    test_task.save()

    data = {"crew_id": crew.pk}
    url = reverse("run-session")

    response = api_client.post(url, data, format="json")

    response_session_id: int = response.data["session_id"]

    redis_client_mock.publish.assert_called_once_with(
        "sessions:start", response_session_id
    )


@pytest.mark.django_db
def test_session_set_session_data(crew, test_task, api_client, redis_client_mock):
    """
    Test if redis.set method called at with correct key (ignoring value)
    """
    # add test task to crew
    test_task.crew = crew
    test_task.save()

    data = {"crew_id": crew.pk}
    url = reverse("run-session")

    response = api_client.post(url, data, format="json")
    response_session_id: int = response.data["session_id"]

    assert (
        redis_client_mock.set.call_args.args[0]
        == f"sessions:{response_session_id}:schema"
    )
