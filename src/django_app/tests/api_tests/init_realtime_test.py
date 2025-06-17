import pytest
import json
from django.urls import reverse
from rest_framework import status
from tables.models import Agent
from tests.fixtures import *

@pytest.mark.django_db
def test_init_realtime(wikipedia_agent_with_configured_realtime, api_client, redis_client_mock):
    agent_id = wikipedia_agent_with_configured_realtime.pk 

    url = reverse('init-realtime')

    data = {
        'agent_id': agent_id
    }

    response = api_client.post(url, data=data, format="json")
    response_data = response.json()

    # Assert that the response status code is 201
    assert response.status_code == status.HTTP_201_CREATED, response_data

    # Assert that the response contains the 'connection_key' field
    assert 'connection_key' in response_data
    assert isinstance(response_data['connection_key'], str)

    redis_client_mock.publish.assert_called()
