import subprocess
from json import dumps
import docker
from docker.models.images import Image

client = docker.from_env()


def run_tool_in_container(
    *, image: Image | str, tool_kwargs: dict | None = None
) -> str:
    enviroment = {}
    if tool_kwargs:
        tool_kwargs_string = dumps(tool_kwargs)
        enviroment["TOOL_KWARGS"] = tool_kwargs_string

    byte_out = client.containers.run(
        image=image, environment=enviroment
    )
    return byte_out.decode("utf-8")


