import pytest
from django.urls import reverse
from rest_framework import status

from tables.models import Graph
from tests.fixtures import *


@pytest.mark.django_db
def test_graph_list(api_client, graph):
    url = reverse("graphs-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK, response.content


@pytest.mark.django_db
def test_graph_list_empty(api_client):
    url = reverse("graphs-list")

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK, response.content
    assert response.data["count"] == 0


@pytest.mark.django_db
def test_graph_post(api_client):
    url = reverse("graphs-list")
    data = {"name": "test post", "metadata": {"data": "test data"}}

    response = api_client.post(url, data, format="json")
    graph = Graph.objects.get(id=response.data["id"])

    assert response.status_code == status.HTTP_201_CREATED, response.content
    assert response.data["name"] == data["name"]
    assert graph.name == data["name"]
    assert response.data["metadata"] == data["metadata"]
    assert graph.metadata == data["metadata"]


@pytest.mark.django_db
def test_graph_detail(api_client, graph):
    url = reverse("graphs-detail", args=[graph.id])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK, response.content


@pytest.mark.django_db
def test_graph_detail_not_found(api_client):
    url = reverse("graphs-detail", args=[999])

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content


@pytest.mark.django_db
def test_graph_put(api_client, graph):
    url = reverse("graphs-detail", args=[graph.id])
    data = {"name": "test put", "metadata": {"data": "test data"}}

    response = api_client.put(url, data, format="json")
    graph = Graph.objects.get(id=response.data["id"])

    assert response.status_code == status.HTTP_200_OK, response.content
    assert response.data["name"] == data["name"]
    assert graph.name == data["name"]
    assert response.data["metadata"] == data["metadata"]
    assert graph.metadata == data["metadata"]


@pytest.mark.django_db
def test_graph_patch(api_client, graph):
    url = reverse("graphs-detail", args=[graph.id])
    data = {"metadata": {"data": "test data"}}

    response = api_client.patch(url, data, format="json")
    graph = Graph.objects.get(id=response.data["id"])

    assert response.status_code == status.HTTP_200_OK, response.content
    assert response.data["metadata"] == data["metadata"]
    assert graph.metadata == data["metadata"]


@pytest.mark.django_db
def test_graph_delete(api_client, graph):
    url = reverse("graphs-detail", args=[graph.id])

    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content

    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content
