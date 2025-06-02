import pytest
from django.urls import reverse
from tables.models import Session
from tests.fixtures import *
from redis.commands.core import PubSubCommands
from unittest.mock import MagicMock


@pytest.mark.django_db
def test_run_session(crew, api_client, mocker, mock_redis: MagicMock):

    url = reverse("run-session")
    data = {"crew_id": crew.pk}
    response = api_client.post(url, data, format="json")

    response_session_id: int = response.data["session_id"]
    session = Session.objects.get(pk=response_session_id)

    mock_redis.publish.assert_called_once_with("sessions:start", response_session_id)

    assert session.crew.pk == crew.pk
