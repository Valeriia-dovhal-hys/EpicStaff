from typing import Optional
import requests

import docker
from docker.models.images import Image
from docker.models.containers import Container

from models.models import RunCrewModel
from services.crew_image_service import CrewImageService

class CrewContainerService:
    client = docker.client.from_env()

    def __init__(self):
        self.crew_image_service = CrewImageService()

        tr_container = self.client.containers.get('registry')
        network_settings = tr_container.attrs['NetworkSettings']
        self.network_name = list(network_settings['Networks'].keys())[0]


    def request_run_crew(self, run_crew_model: RunCrewModel):
        image = self.crew_image_service.get_image()

        unique_id = run_crew_model.data["crew_id"]
        container_name = f"crew_{unique_id}" 
        container = self.run_container(image, container_name)

        response = requests.post(
            url=f'http://{container.name}:8000/crew/run',
            json=run_crew_model.model_dump()
        )

        return response.json()


    def run_container(
            self, 
            image: Image,
            container_name: str,
            port: int = 0
    ) -> Container:
        
        container_crew = self.client.containers.run(
            image=image,
            ports={"8000/tcp": port},
            network=self.network_name,
            detach=True,
            name=container_name
        )

        return container_crew
