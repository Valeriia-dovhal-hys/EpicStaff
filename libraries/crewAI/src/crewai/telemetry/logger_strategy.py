from __future__ import annotations

import pkg_resources
import json
from typing import TYPE_CHECKING, Any, override

from opentelemetry.trace import Span
from crewai.telemetry.abstract_telemetry_strategy import AbstractTelemetryStrategy

from crewai.utilities.logger import FileLogger

if TYPE_CHECKING:
    from crewai.crew import Crew
    from crewai.task import Task


class LoggerStrategy(AbstractTelemetryStrategy):

    def __init__(self, logger: FileLogger):
        self._logger = logger

    @override
    def set_tracer(self):
        self._logger.log("info", "LoggerStrategy initialized.")

    @override
    def crew_creation(self, crew, inputs):
        self._logger.log(
            "info",
            f"Crew created: ID={crew.id}, Process={crew.process}, "
            f"Memory={crew.memory}, Tasks={len(crew.tasks)}, "
            f"Agents={len(crew.agents)}",
        )

    @override
    def task_started(self, crew: Crew, task: Task) -> Span | None:
        self._logger.log(
            "info",
            f"Task started: TaskID={task.id}, Description={task.description}, "
            f"Expected Output={task.expected_output}, "
            f"CrewID={crew.id}",
        )
        return None

    @override
    def task_ended(self, span: Span, task: Task, crew: Crew):
        self._logger.log(
            "info",
            f"Task ended: TaskID={task.id}, CrewID={crew.id}, "
            f"Output={task.output.raw if task.output else "None"}"
        )

    @override
    def tool_repeated_usage(self, llm: Any, tool_name: str, attempts: int):
        self._logger.log(
            "warning",
            f"Repeated usage of tool {tool_name} by llm {llm}, "
            f"{attempts} attempts were made so far"
        )

    @override
    def tool_usage(self, llm: Any, tool_name: str, attempts: int):
        self._logger.log(
            "info",
            f"Tools usage: {tool_name} by llm {llm} "
            f"{attempts} attempts were made so far"
        )


    @override
    def tool_usage_error(self, llm: Any):
        self._logger.log(
            "error",
            f"Tool usage error by llm {llm}"
        )

    
    @override
    def individual_test_result_span(self, crew: Crew, quality: float, exec_time: int, model_name: str):
        self._logger.log(
            "info",
            f"Individual Test Result: Crew {crew.key}, "
            f"Crew ID: {crew.id}, Quality: {quality}, "
            f"Execution Time: {exec_time}s, Model: {model_name}, "
            f"Version: {pkg_resources.get_distribution('crewai').version}"
        )

    
    @override
    def test_execution_span(self, crew: Crew, iterations: int, inputs: dict[str, Any] | None, model_name: str):
        log_message = (
                f"Test Execution: Crew {crew.key}, "
                f"Crew ID: {crew.id}, Iterations: {iterations}, "
                f"Model: {model_name}, Version: {pkg_resources.get_distribution('crewai').version}"
            )
        
        if crew.share_crew:
                inputs_str = json.dumps(inputs) if inputs else "None"
                log_message += f", Inputs: {inputs_str}"

        self._logger.log(
            "info",
            log_message
        )


    @override
    def deploy_signup_error_span(self):
        self._logger.log(
            "error",
            f"Deploy Signup Error occurred"
        )


    @override
    def start_deployment_span(self, uuid: str | None = None):
        log_message = "Start Deployment"
        log_message += f" with UUID: {uuid}" if uuid else ""
        self._logger.log(
            "info",
            log_message
        )


    @override
    def create_crew_deployment_span(self):
        self._logger.log(
            "info",
            f"Create Crew Deployment initiated"
        )

    
    @override
    def get_crew_logs_span(self, uuid: str | None, log_type: str = "deployment"):
        log_message = f"Get Crew Logs for log type: {log_type}"
        log_message += f" with UUID: {uuid}" if uuid else ""
        self._logger.log(
            "info",
            log_message
        )


    @override
    def remove_crew_span(self, uuid: str | None = None):
        log_message = "Remove Crew initiated"
        log_message += f" with UUID: {uuid}" if uuid else ""
        self._logger.log(
            "info",
            log_message
        )

    
    @override
    def crew_execution_span(self, crew: Crew, inputs: dict[str, Any] | None):
        self._logger.log(
            "info",
            f"Crew execution started: CrewID={crew.id}. Inputs={inputs}"
        )


    @override
    def end_crew(self, crew, final_string_output):
        self._logger.log(
            "info",
            f"Crew execution ended: CrewID={crew.id}. Output: {final_string_output}"
        )
    