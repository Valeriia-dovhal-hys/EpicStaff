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
