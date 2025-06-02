import pytest
from django.urls import reverse
from tests.fixtures import *


@pytest.mark.django_db
def test_run_session_publish_start_session(crew, api_client, redis_client_mock):

    data = {"crew_id": crew.pk}
    url = reverse("run-session")

    response = api_client.post(url, data, format="json")

    response_session_id: int = response.data["session_id"]

    redis_client_mock.publish.assert_called_once_with("sessions:start", response_session_id)
