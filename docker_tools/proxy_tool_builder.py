import json
import time
from typing import Any, Type
from pydantic import BaseModel as V2BaseModel
from langchain_core.tools import BaseTool
import requests

from .schema_converter.converter import generate_model_from_schema
from .pickle_encode import txt_to_obj, obj_to_txt
from docker import client
from docker.models.images import Image


class ProxyToolBuilder:

    def __init__(self, *args, **kwargs):
        self.image = kwargs["image"]
        self.port = kwargs["port"]

    def build(self) -> Type[BaseTool]:
        resp = self.fetch_data_with_retry(
            url=f"http://localhost:{self.port}/tool/class-data"
        )
        data_txt = resp.json()["classdata"]
        data: dict = txt_to_obj(data_txt)
        args_schema_json_schema = data["args_schema_json_schema"]
        data["args_schema"] = generate_model_from_schema(args_schema_json_schema)

        data.pop("args_schema_json_schema", None)

        data["_run"] = lambda *args, **kwargs: self.run_tool_in_container(
            run_params=(args[1:], kwargs),  # remove self
        )

        return type("ProxyTool", (BaseTool,), {**data})

    # TODO: rewrite

    def run_tool_in_container(
        self,
        run_params: tuple[tuple, dict[str, Any]] | None = None,
    ) -> str:
        tool_run_params_txt = obj_to_txt(run_params)
        response = requests.post(
            url=f"http://localhost:{self.port}/tool/run",
            data=json.dumps({"run_params_txt": tool_run_params_txt}),
        )

        return response.json()["data"]

    # TODO: make async
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
