import time
from typing import Any, Type
from langchain_core.tools import BaseTool
import requests

from services.schema_converter.converter import generate_model_from_schema
from services.pickle_encode import txt_to_obj, obj_to_txt
from loguru import logger


class ProxyToolFactory:

    def __init__(
        self,
        host: str = "manager_container",
        port: int = 8000,
    ):
        self.host = host
        self.port = port

    def create_proxy_class(
        self,
        tool_alias: str,
        tool_config: dict[str, Any] = None,
    ) -> Type[BaseTool]:
        resp = self.fetch_data_with_retry(
            url=f"http://{self.host}:{self.port}/tool/{tool_alias}/class-data"
        )
        data_txt = resp.json()["classdata"]
        data: dict = txt_to_obj(data_txt)
        args_schema_json_schema = data["args_schema_json_schema"]
        data["args_schema"] = generate_model_from_schema(
            args_schema_json_schema
        )  # TODO: rename

        data.pop("args_schema_json_schema", None)

        def modified_run(*args, **kwargs):

            args = kwargs.get("args", tuple())

            kw: dict = kwargs.get("kwargs", dict())

            exclude_keys = {"args", "kwargs"}

            other_kw = {k: v for k, v in kwargs.items() if k not in exclude_keys}

            kw.update(other_kw)

            logger.debug(f"args = {args}\nkwargs = {kw}")

            return self.run_tool_in_container(
                tool_alias=tool_alias, tool_config=tool_config, run_params=(args, kw)
            )

        data["_run"] = modified_run

        return type("ProxyTool", (BaseTool,), {**data})  # TODO: Change ProxyTool name

    def run_tool_in_container(
        self,
        tool_alias: str,
        tool_config: dict[str, Any],
        run_params: tuple[tuple, dict[str, Any]],
    ) -> str:

        run_args = run_params[0]
        run_kwargs = run_params[1]

        response = requests.post(
            url=f"http://{self.host}:{self.port}/tool/{tool_alias}/run",
            json={
                "tool_config": tool_config,
                "run_args": run_args,
                "run_kwargs": run_kwargs,
            },
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
