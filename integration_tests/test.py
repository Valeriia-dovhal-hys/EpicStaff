import requests
import pytest
from time import sleep



BASE_URL = "http://127.0.0.1:8000/api"



def test_get_providers():
    url = "http://127.0.0.1:8000/api/providers/"
    sleep(120)
    response = requests.get(url)

    response.raise_for_status()