from __future__ import annotations


from typing import Any, override, TYPE_CHECKING

from opentelemetry.trace import Span

from crewai.telemetry.abstract_telemetry_strategy import AbstractTelemetryStrategy

from crewai.utilities import Logger
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
	def crew_creation(self, crew):
		self._logger.log("info", f"Crew created: ID={crew.id}, Process={crew.process}, "
								 f"Memory={crew.memory}, Tasks={len(crew.tasks)}, "
								 f"Agents={len(crew.agents)}")

	@override
	def task_started(self, task: Task) -> Span | None:
		self._logger.log("info", f"Task started: ID={task.id}, Description={task.description}, "
								 f"Expected Output={task.expected_output}")
		return None  # No Span object needed for logging

	@override
	def task_ended(self, span: Span, task: Task):
		self._logger.log("info",
						 f"Task ended: ID={task.id}, Output={task.output.raw_output if task.output else 'None'}")

	@override
	def tool_repeated_usage(self, llm: Any, tool_name: str, attempts: int):
		self._logger.log("warning", f"Repeated usage of tool: {tool_name} by LLM {llm}. Attempts={attempts}")

	@override
	def tool_usage(self, llm: Any, tool_name: str, attempts: int):
		self._logger.log("info", f"Tool usage: {tool_name} by LLM {llm}. Attempts={attempts}")

	@override
	def tool_usage_error(self, llm: Any):
		self._logger.log("error", f"Tool usage error by LLM: {llm}")

	@override
	def crew_execution_span(self, crew: Crew, inputs: dict[str, Any] | None):
		self._logger.log("info", f"Crew execution started: ID={crew.id}, Inputs={inputs}")

	@override
	def end_crew(self, crew: Crew, output: Any):
		self._logger.log("info", f"Crew execution ended: ID={crew.id}, Output={output}")

