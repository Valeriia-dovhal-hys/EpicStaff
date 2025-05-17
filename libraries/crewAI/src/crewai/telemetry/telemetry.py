from __future__ import annotations


import os

from enum import Enum
from pathlib import Path
from typing import TYPE_CHECKING, Any


from opentelemetry.trace import Span

from crewai.telemetry.logger_strategy import LoggerStrategy
from crewai.telemetry.server_strategy import ServerStrategy
from crewai.utilities import Logger
from crewai.telemetry.abstract_telemetry_strategy import AbstractTelemetryStrategy
from crewai.utilities.logger import FileLogger

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

    Data collected includes:
    - Version of crewAI
    - Version of Python
    - General OS (e.g. number of CPUs, macOS/Windows/Linux)
    - Number of agents and tasks in a crew
    - Crew Process being used
    - If Agents are using memory or allowing delegation
    - If Tasks are being executed in parallel or sequentially
    - Language model being used
    - Roles of agents in a crew
    - Tools names available

    Users can opt-in to sharing more complete data suing the `share_crew`
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

    def crew_creation(self, crew):
        self.telemetry_strategy.crew_creation(crew)

    def task_started(self, task: Task) -> Span | None:
        return self.telemetry_strategy.task_started(task)

    def task_ended(self, span: Span, task: Task):
        self.telemetry_strategy.task_ended(span, task)

    def tool_repeated_usage(self, llm: Any, tool_name: str, attempts: int):
        self.telemetry_strategy.tool_repeated_usage(llm, tool_name, attempts)

    def tool_usage(self, llm: Any, tool_name: str, attempts: int):
        self.telemetry_strategy.tool_usage(llm, tool_name, attempts)

    def tool_usage_error(self, llm: Any):
        self.telemetry_strategy.tool_usage_error(llm)

    def crew_execution_span(self, crew: Crew, inputs: dict[str, Any] | None):
        return self.telemetry_strategy.crew_execution_span(crew, inputs)

    def end_crew(self, crew, output):
        self.telemetry_strategy.end_crew(crew, output)





