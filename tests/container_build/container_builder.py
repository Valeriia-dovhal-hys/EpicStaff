import docker
from docker.models.images import Image
from docker.models.containers import Container
from docker.errors import ImageNotFound, NotFound
from pathlib import Path

# TODO IF NEEDED
class ManagerContainerBuilder:

    client = docker.client.from_env()
    image_name = "manager"
    port = 8001
    dockerfile = Path('./manager/image_files/Dockerfile.reg').resolve().as_posix()
    path = Path('./manager/image_files').resolve().as_posix()
    container_name = "manager_container"

    def __init__(self, *, image_name="manager", port=8001, force_build=False):
        self.image_name = image_name
        self.port = port
        self.force_build = force_build


    def run_container(self) -> Container:
        """
        Run a Docker container from the specified image. If the container 
        already exists and is running, it will return the existing container.
        Otherwise, it will start a new one.
        """

        try:
            container = self.client.containers.get(self.container_name)
            if container.status == 'running':
                return container
            else:
                container.start()
                return container
        except NotFound:
            # TODO: Log here that container does not exist and it's going to build it
            pass
    
        image = self.build_image()
        container = self.client.containers.run(
            image=self.image_name,
            ports={"8000/tcp": self.port},
            volumes={
                '/var/run/docker.sock': { 
                    'bind': '/var/run/docker.sock', 
                    'mode': 'rw'
                },

                '/usr/bin/docker': {
                    'bind': '/usr/bin/docker', 
                    'mode': 'rw'
                }
            },
            tty=True,
            stdin_open=True,
            detach=True,
            network='my-net',
            name=self.container_name,
        )
        return container


    def build_image(self) -> Image:
        """
        Build the Docker image if it does not exist. If the image already 
        exists, it returns the existing image.
        """

        try:
            if self.force_build: raise ImageNotFound("workaround")
            image = self.client.images.get(self.image_name)
        except ImageNotFound:
            image, _ = self.client.images.build(
                dockerfile=self.dockerfile,
                tag=self.image_name,
                path=self.path,
            )

        return image
    

if __name__ == "__main__":
    builder = ManagerContainerBuilder(force_build=True)
    container = builder.run_container()

