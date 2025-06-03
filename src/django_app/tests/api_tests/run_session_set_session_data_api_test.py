import pytest
from django.urls import reverse
from tests.fixtures import *


@pytest.mark.django_db
def test_session_set_session_data(crew, api_client, redis_client_mock):
    """
    Test if redis.set method called at with correct key (ignoring value)
    """

    data = {"crew_id": crew.pk}
    url = reverse("run-session")

    response = api_client.post(url, data, format="json")    
    response_session_id: int = response.data["session_id"]

    redis_client_mock.set.call_args.args[0] == f"sessions:{response_session_id}:schema"
