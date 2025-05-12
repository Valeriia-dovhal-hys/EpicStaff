from enum import Enum
from docker.models.images import Image

from build_langchain_tool import ToolDockerImageBuilder, get_image_by_name, client
from base_models import *
from proxy_tool_factory import ProxyToolFactory

proxy_tool_factory = ProxyToolFactory(host="localhost", port=4800)

def import_tool(tool_alias):

    return proxy_tool_factory.create_proxy_class(tool_alias)
