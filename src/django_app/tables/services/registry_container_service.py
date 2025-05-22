import requests
from tables.serializers.nested_model_serializers import NestedCrewSerializer

class RegistryContainerService:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def run_crew(self, serialized_crew) -> dict:
        url = f"{self.base_url}/crew/run"
        payload = {"data": serialized_crew}
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()
