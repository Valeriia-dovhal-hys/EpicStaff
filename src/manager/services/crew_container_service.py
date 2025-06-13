from typing import Optional
import requests
import time
from docker.types import Mount

import docker
from docker.models.images import Image
from docker.models.containers import Container

from helpers.logger import logger
from models.models import RunCrewModel
from services.crew_image_service import CrewImageService


class CrewContainerService:
    client = docker.client.from_env()

    def __init__(self):
        self.crew_image_service = CrewImageService()

        manager_container = self.client.containers.get('manager_container')
        network_settings = manager_container.attrs['NetworkSettings']
        self.network_name = list(network_settings['Networks'].keys())[0]


    def request_run_crew(self, session_id: int):
        image = self.crew_image_service.get_image()

        container_name = f"crew_session-{session_id}"
        self.run_container(image, container_name, session_id)


    def run_container(
        self, image: Image, container_name: str, session_id: int, port: int = 0
    ) -> Container:
        # Check if a container with the given name already exists
        for container in self.client.containers.list(all=True):
            if container.name == container_name:
                logger.info(f"Container with name {container_name} already exists, removing it.")
                container.remove(force=True)
                break


        # Create one of not exists
        try:
            container_crew = self.client.containers.run(
                image=image,
                ports={"7000/tcp": port},
                network=self.network_name,
                environment={
                    "SESSION_ID": str(session_id),
                    "HAYSTACK_TELEMETRY_ENABLED": False,
                    "ANONYMIZED_TELEMETRY": False,
                    "EC_TELEMETRY": False,
                    "MONITORING_MODE": "local",
                    "PROCESS_REDIS_HOST": "redis",
                },
                mounts=[
                    Mount(
                        source="crew_config",
                        target="/home/user/root/app/env_config/",
                    )
                ],
                detach=True,
                name=container_name,
            )
            logger.info(f"Container {container_name} for session_id {session_id} created successfully.")
        except Exception as e:
            logger.error(f"Error while creating container {container_name} for session_id {session_id}: {str(e)}")
            raise

        return container_crew
