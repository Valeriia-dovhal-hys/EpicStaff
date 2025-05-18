from __future__ import annotations

import os
import warnings
from enum import Enum
from pathlib import Path
from typing import TYPE_CHECKING, Any, Optional

from crewai.telemetry.logger_strategy import LoggerStrategy
from crewai.telemetry.server_strategy import ServerStrategy
from crewai.utilities import Logger
from crewai.telemetry.abstract_telemetry_strategy import AbstractTelemetryStrategy
from crewai.utilities.logger import FileLogger

from opentelemetry.trace import Span

if TYPE_CHECKING:
    from crewai.crew import Crew
    from crewai.task import Task


class MonitoringType(Enum):
    LOCAL = "local"
    SERVER = "server"


class Telemetry:
    """A class to handle anonymous telemetry for the crewai package.

    The data being collected is for development purpose, all data is anonymous.

    There is NO data being collected on the prompts, tasks descriptions
    agents backstories or goals nor responses or any data that is being
    processed by the agents, nor any secrets and env vars.

    Users can opt-in to sharing more complete data using the `share_crew`
    attribute in the Crew class.
    """

    def __init__(self):
        
        monitoring_type_str: str = os.environ.get("MONITORING_TYPE", MonitoringType.LOCAL)
        monitoring_type_enum: MonitoringType = MonitoringType(monitoring_type_str)

        if monitoring_type_enum == MonitoringType.SERVER:
            telemetry_server_endpoint_env: str = os.environ.get("MONITORING_SERVER", "localhost")
            self.telemetry_strategy: AbstractTelemetryStrategy = ServerStrategy(server_url=telemetry_server_endpoint_env)

        # elif monitoring_type_enum == MonitoringType.LOCAL:
        else:
            monitoring_path_str = os.environ.get("MONITORING_LOCAL_PATH", ".")
            monitoring_path = Path(monitoring_path_str)
            monitoring_path.mkdir(parents=True, exist_ok=True)
            monitoring_path = Path(monitoring_path, "log.txt")  # hardcoded filename

            self.telemetry_strategy: AbstractTelemetryStrategy = LoggerStrategy(
                FileLogger(filepath=monitoring_path, verbose_level=2)
            )

    def set_tracer(self):
        self.telemetry_strategy.set_tracer()

    def crew_creation(self, crew: Crew, inputs: dict[str, Any] | None):
        self.telemetry_strategy.crew_creation(crew, inputs)

    def task_started(self, crew: Crew, task: Task) -> Span | None:
        self.telemetry_strategy.task_started(crew, task)

    def task_ended(self, span: Span, task: Task, crew: Crew):
        self.telemetry_strategy.task_ended(span, task, crew)

    def tool_repeated_usage(self, llm: Any, tool_name: str, attempts: int):
        self.telemetry_strategy.tool_repeated_usage(llm, tool_name, attempts)

    def tool_usage(self, llm: Any, tool_name: str, attempts: int):
        self.telemetry_strategy.tool_usage(llm, tool_name, attempts)

    def tool_usage_error(self, llm: Any):
        self.telemetry_strategy.tool_usage_error(llm)

    def individual_test_result_span(
        self, crew: Crew, quality: float, exec_time: int, model_name: str
    ):
        self.telemetry_strategy.individual_test_result_span(crew, quality, exec_time, model_name)

    def test_execution_span(
        self,
        crew: Crew,
        iterations: int,
        inputs: dict[str, Any] | None,
        model_name: str,
    ):
        self.telemetry_strategy.test_execution_span(crew, iterations, inputs, model_name)

    def deploy_signup_error_span(self):
        self.telemetry_strategy.deploy_signup_error_span()

    def start_deployment_span(self, uuid: Optional[str] = None):
        self.telemetry_strategy.start_deployment_span(uuid)

    def create_crew_deployment_span(self):
        self.telemetry_strategy.create_crew_deployment_span()

    def get_crew_logs_span(self, uuid: Optional[str], log_type: str = "deployment"):
        self.telemetry_strategy.get_crew_logs_span(uuid, log_type)

    def remove_crew_span(self, uuid: Optional[str] = None):
        self.telemetry_strategy.remove_crew_span(uuid)

    def crew_execution_span(self, crew: Crew, inputs: dict[str, Any] | None):
        self.telemetry_strategy.crew_execution_span(crew, inputs)

    def end_crew(self, crew, final_string_output):
        self.telemetry_strategy.end_crew(crew, final_string_output)
