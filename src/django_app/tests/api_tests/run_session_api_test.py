import pytest
from django.urls import reverse
from tables.models.graph_models import CrewNode, Edge, Graph, StartNode
from tables.models import Session
from tests.fixtures import *


@pytest.mark.django_db
def test_run_session(crew, api_client, redis_client_mock):
    graph = Graph.objects.create(name="test_run_session_graph")
    CrewNode.objects.create(node_name="crew_node_1", crew=crew, graph=graph)
    StartNode.objects.create(graph=graph, variables={})
    Edge.objects.create(graph=graph, start_key="__start__", end_key="crew_node_1")
    data = {
        "graph_id": graph.pk,
        "variables": {
            "additionalProp1": "string",
            "additionalProp2": "string",
            "additionalProp3": "string",
        },
    }
    url = reverse("run-session")

    response = api_client.post(url, data, format="json")

    response_session_id: int = response.data["session_id"]
    session = Session.objects.get(pk=response_session_id)

    assert session.graph.pk == graph.pk
    assert session.variables == data["variables"]
    redis_client_mock.publish.assert_called()
    assert session.status == "pending"
