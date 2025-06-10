import pytest
from django.urls import reverse
from tests.fixtures import *
from rest_framework import status


@pytest.mark.django_db
def test_get_environment_config(api_client, yaml_config_service_patched_config_path):
    test_keys = {"key1": "some value", "key2": "other_value"}
    file_content = ""
    for k, v in test_keys.items():
        file_content += f"{k}: {v}\n"

    with open(yaml_config_service_patched_config_path, "w") as f:
        f.write(file_content)

    url = reverse("environment_config")

    response = api_client.get(url, format="json")

    assert response.json()["data"] == test_keys


@pytest.mark.django_db
def test_create_environment_config(api_client, yaml_config_service_patched_config_path):
    url = reverse("environment_config")
    data = {
        "data": {
            "key1": "value1",
            "key2": "value2",
        }
    }

    response = api_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED

    expected_file_content = ""
    for k, v in data["data"].items():
        expected_file_content += f"{k}: {v}\n"

    with open(yaml_config_service_patched_config_path, "r") as f:
        assert f.read() == expected_file_content


@pytest.mark.django_db
def test_create_environment_config_overwriting_keys(
    api_client, yaml_config_service_patched_config_path
):
    test_keys = {"key1": "some value", "key2": "other_value"}
    file_content = ""
    for k, v in test_keys.items():
        file_content += f"{k}: {v}\n"

    with open(yaml_config_service_patched_config_path, "w") as f:
        f.write(file_content)

    data = {
        "data": {
            "key3": "value3",
            "key2": "value2",
        }
    }
    url = reverse("environment_config")

    response = api_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED

    expected_data = {
        "data": {
            "key1": "some value",
            "key2": "value2",
            "key3": "value3",
        }
    }

    assert response.json() == expected_data


@pytest.mark.django_db
def test_delete_environment_config(api_client, yaml_config_service_patched_config_path):
    test_keys = {"key1": "some value", "key2": "other_value"}
    file_content = ""
    for k, v in test_keys.items():
        file_content += f"{k}: {v}\n"

    with open(yaml_config_service_patched_config_path, "w") as f:
        f.write(file_content)

    url_key1 = reverse("delete_environment_config", args=["key1"])

    response = api_client.delete(url_key1, format="json")
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
def test_delete_not_existing_environment_config(
    api_client, yaml_config_service_patched_config_path
):
    test_keys = {"key1": "some value", "key2": "other_value"}
    file_content = ""
    for k, v in test_keys.items():
        file_content += f"{k}: {v}\n"

    with open(yaml_config_service_patched_config_path, "w") as f:
        f.write(file_content)

    url_key3 = reverse("delete_environment_config", args=["key3"])

    response = api_client.delete(url_key3, format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND
