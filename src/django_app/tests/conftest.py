from pathlib import Path
import pytest
from rest_framework.test import APIClient


@pytest.fixture
def resources_path():
    return Path("./tests/resources/").resolve()

@pytest.fixture
def tmp_path():
    return Path("./tests/tmp/").resolve()

@pytest.fixture
def api_client() -> APIClient:
    return APIClient()
