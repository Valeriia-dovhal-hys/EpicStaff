from typing import Optional
import requests
import time

import docker
from docker.models.images import Image
from docker.models.containers import Container

from models.models import RunCrewModel
from services.crew_image_service import CrewImageService

class CrewContainerService:
    client = docker.client.from_env()

    def __init__(self):
        self.crew_image_service = CrewImageService()

        tr_container = self.client.containers.get('manager_container')
        network_settings = tr_container.attrs['NetworkSettings']
        self.network_name = list(network_settings['Networks'].keys())[0]


    def fetch_data_with_retry(self, url, retries=10, delay=3):
        for attempt in range(retries):
            try:
                print(f"Attempt {attempt + 1} to fetch data...")
                resp = requests.post(url)
                if resp.status_code == 200:
                    return resp
            except requests.exceptions.RequestException as e:
                print(f"Request failed: {e}")
            # Wait before retrying
            if attempt < retries - 1:
                time.sleep(delay)
        raise Exception(f"Failed to fetch data after {retries} attempts.")


    def request_run_crew(self, crew_id):
        image = self.crew_image_service.get_image()

        container_name = f"crew_{crew_id}" 
        self.run_container(image, container_name, crew_id)


    def run_container(
            self, 
            image: Image,
            container_name: str,
            crew_id: int,
            port: int = 0
    ) -> Container:
        
        # Check if a container with the given name already exists
        existing_container = None
        for container in self.client.containers.list(all=True):
            if container.name == container_name:
                existing_container = container
                break
        
        if existing_container:
            return existing_container
        
        # Create one of not exists
        container_crew = self.client.containers.run(
            image=image,
            ports={"7000/tcp": port},
            network=self.network_name,
            environment={"CREW_ID": str(crew_id)},
            detach=True,
            name=container_name
        )

        return container_crew
