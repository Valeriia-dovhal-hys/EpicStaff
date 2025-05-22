import time
import requests

import docker
from docker.models.images import Image
from docker.models.containers import Container

from models.models import RunToolParamsModel
from repositories.import_tool_data_repository import (
    ImportToolDataRepository,
)
from services.tool_image_service import ToolImageService


class ToolContainerService:
    docker_client = docker.client.from_env()

    def __init__(
        self,
        tool_image_service: ToolImageService,
        import_tool_data_repository: ImportToolDataRepository,
    ):
        self.tool_image_service = tool_image_service
        self.import_tool_data_repository = import_tool_data_repository
        
        tr_container = self.docker_client.containers.get('manager')
        network_settings = tr_container.attrs['NetworkSettings']
        self.network_name = list(network_settings['Networks'].keys())[0]

    def fetch_data_with_retry(self, url, retries=10, delay=3):
        for attempt in range(retries):
            try:
                print(f"Attempt {attempt + 1} to fetch data...")
                resp = requests.get(url)
                if resp.status_code == 200:
                    return resp
            except requests.exceptions.RequestException as e:
                print(f"Request failed: {e}")
            # Wait before retrying
            if attempt < retries - 1:
                time.sleep(delay)
        raise Exception(f"Failed to fetch data after {retries} attempts.")

    def find_running_containers_by_image_name(self, image_name) -> list[Container]:

        return self.docker_client.containers.list(filters={"ancestor": image_name})

    def get_running_tool(self, tool_alias: str) -> Container | None:
        image_name = self.import_tool_data_repository.find_image_name_by_tool_alias(
            tool_alias=tool_alias
        )
        list_containers = self.find_running_containers_by_image_name(image_name)
        if not list_containers:
            return None
        return list_containers[0]

    def request_class_data(self, tool_alias: str) -> dict:
        container = self.get_running_tool(tool_alias=tool_alias)
        if not container:
            container = self.run_container_by_tool_alias(tool_alias=tool_alias)

        response = self.fetch_data_with_retry(
            f"http://{container.name}:8000/tool/{tool_alias}/class-data/"
        )
        return response.json()

    def request_run_tool(
        self, tool_alias: str, run_tool_params_model: RunToolParamsModel
    ) -> dict:
        container = self.get_running_tool(tool_alias=tool_alias)
        if not container:
            container = self.run_container_by_tool_alias(tool_alias=tool_alias)

        response = requests.post(
            url=f"http://{container.name}:8000/tool/{tool_alias}/run",
            json=run_tool_params_model.model_dump(),
        )
        return response.json()

    def run_container_by_tool_alias(self, tool_alias):
        image = self.tool_image_service.get_or_build_tool_alias(tool_alias=tool_alias)
        return self.run_container(image=image)

    def run_container(
        self, image: Image, container_name=None, port: int = 0
    ) -> Container:
        if container_name is None:
            container_name = image.tags[-1].split(":")[0]

        container_tool = self.docker_client.containers.run(
            image=image,
            ports={"8000/tcp": port},
            network=self.network_name,
            detach=True,
            name=container_name,
        )

        return container_tool
