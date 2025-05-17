from __future__ import annotations


from typing import Any, override


from crewai.telemetry.abstract_telemetry_strategy import AbstractTelemetryStrategy


import asyncio
import json
import os
import platform

from typing import TYPE_CHECKING, Any

import pkg_resources
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace import Span, Status, StatusCode


if TYPE_CHECKING:
	from crewai.crew import Crew
	from crewai.task import Task


class ServerStrategy(AbstractTelemetryStrategy):

	def __init__(self, server_url):
		self.ready = False
		self.trace_set = False
		try:
			telemetry_endpoint = server_url
			self.resource = Resource(
				attributes={SERVICE_NAME: "crewAI-telemetry"},
			)
			self.provider = TracerProvider(resource=self.resource)

			processor = BatchSpanProcessor(
				OTLPSpanExporter(
					endpoint=f"{telemetry_endpoint}/v1/traces",
					timeout=30,
				)
			)

			self.provider.add_span_processor(processor)
			self.ready = True
		except BaseException as e:
			if isinstance(
					e,
					(SystemExit, KeyboardInterrupt, GeneratorExit, asyncio.CancelledError),
			):
				raise  # Re-raise the exception to not interfere with system signals
			self.ready = False

	@override
	def set_tracer(self):
		if self.ready and not self.trace_set:
			try:
				trace.set_tracer_provider(self.provider)
				self.trace_set = True
			except Exception:
				self.ready = False
				self.trace_set = False

	@override
	def crew_creation(self, crew):
		"""Records the creation of a crew."""
		if self.ready:
			try:
				tracer = trace.get_tracer("crewai.telemetry")
				span = tracer.start_span("Crew Created")
				self._add_attribute(
					span,
					"crewai_version",
					pkg_resources.get_distribution("crewai").version,
				)
				self._add_attribute(span, "python_version", platform.python_version())
				self._add_attribute(span, "crew_id", str(crew.id))
				self._add_attribute(span, "crew_process", crew.process)
				self._add_attribute(span, "crew_memory", crew.memory)
				self._add_attribute(span, "crew_number_of_tasks", len(crew.tasks))
				self._add_attribute(span, "crew_number_of_agents", len(crew.agents))
				self._add_attribute(
					span,
					"crew_agents",
					json.dumps(
						[
							{
								"id": str(agent.id),
								"role": agent.role,
								"goal": agent.goal,
								"backstory": agent.backstory,
								"verbose?": agent.verbose,
								"max_iter": agent.max_iter,
								"max_rpm": agent.max_rpm,
								"i18n": agent.i18n.prompt_file,
								"llm": json.dumps(self._safe_llm_attributes(agent.llm)),
								"delegation_enabled?": agent.allow_delegation,
								"tools_names": [
									tool.name.casefold() for tool in agent.tools
								],
							}
							for agent in crew.agents
						]
					),
				)
				self._add_attribute(
					span,
					"crew_tasks",
					json.dumps(
						[
							{
								"id": str(task.id),
								"description": task.description,
								"expected_output": task.expected_output,
								"async_execution?": task.async_execution,
								"human_input?": task.human_input,
								"agent_role": task.agent.role if task.agent else "None",
								"context": (
									[task.description for task in task.context]
									if task.context
									else None
								),
								"tools_names": [
									tool.name.casefold() for tool in task.tools
								],
							}
							for task in crew.tasks
						]
					),
				)
				self._add_attribute(span, "platform", platform.platform())
				self._add_attribute(span, "platform_release", platform.release())
				self._add_attribute(span, "platform_system", platform.system())
				self._add_attribute(span, "platform_version", platform.version())
				self._add_attribute(span, "cpus", os.cpu_count())
				span.set_status(Status(StatusCode.OK))
				span.end()
			except Exception:
				pass

	@override
	def task_started(self, task: Task) -> Span | None:
		"""Records task started in a crew."""
		if self.ready:
			try:
				tracer = trace.get_tracer("crewai.telemetry")
				span = tracer.start_span("Task Execution")

				self._add_attribute(span, "task_id", str(task.id))
				self._add_attribute(span, "formatted_description", task.description)
				self._add_attribute(
					span, "formatted_expected_output", task.expected_output
				)

				return span
			except Exception:
				pass

		return None

	@override
	def task_ended(self, span: Span, task: Task):
		"""Records task execution in a crew."""
		if self.ready:
			try:
				self._add_attribute(
					span, "output", task.output.raw_output if task.output else ""
				)

				span.set_status(Status(StatusCode.OK))
				span.end()
			except Exception:
				pass

	@override
	def tool_repeated_usage(self, llm: Any, tool_name: str, attempts: int):
		"""Records the repeated usage 'error' of a tool by an agent."""
		if self.ready:
			try:
				tracer = trace.get_tracer("crewai.telemetry")
				span = tracer.start_span("Tool Repeated Usage")
				self._add_attribute(
					span,
					"crewai_version",
					pkg_resources.get_distribution("crewai").version,
				)
				self._add_attribute(span, "tool_name", tool_name)
				self._add_attribute(span, "attempts", attempts)
				if llm:
					self._add_attribute(
						span, "llm", json.dumps(self._safe_llm_attributes(llm))
					)
				span.set_status(Status(StatusCode.OK))
				span.end()
			except Exception:
				pass

	@override
	def tool_usage(self, llm: Any, tool_name: str, attempts: int):
		"""Records the usage of a tool by an agent."""
		if self.ready:
			try:
				tracer = trace.get_tracer("crewai.telemetry")
				span = tracer.start_span("Tool Usage")
				self._add_attribute(
					span,
					"crewai_version",
					pkg_resources.get_distribution("crewai").version,
				)
				self._add_attribute(span, "tool_name", tool_name)
				self._add_attribute(span, "attempts", attempts)
				if llm:
					self._add_attribute(
						span, "llm", json.dumps(self._safe_llm_attributes(llm))
					)
				span.set_status(Status(StatusCode.OK))
				span.end()
			except Exception:
				pass

	@override
	def tool_usage_error(self, llm: Any):
		"""Records the usage of a tool by an agent."""
		if self.ready:
			try:
				tracer = trace.get_tracer("crewai.telemetry")
				span = tracer.start_span("Tool Usage Error")
				self._add_attribute(
					span,
					"crewai_version",
					pkg_resources.get_distribution("crewai").version,
				)
				if llm:
					self._add_attribute(
						span, "llm", json.dumps(self._safe_llm_attributes(llm))
					)
				span.set_status(Status(StatusCode.OK))
				span.end()

			except Exception:
				pass

	@override
	def crew_execution_span(self, crew: Crew, inputs: dict[str, Any] | None):
		"""Records the complete execution of a crew.
		This is only collected if the user has opted-in to share the crew.
		"""
		if (self.ready) and (crew.share_crew):
			try:
				tracer = trace.get_tracer("crewai.telemetry")
				span = tracer.start_span("Crew Execution")
				self._add_attribute(
					span,
					"crewai_version",
					pkg_resources.get_distribution("crewai").version,
				)
				self._add_attribute(span, "crew_id", str(crew.id))
				self._add_attribute(span, "inputs", json.dumps(inputs))
				self._add_attribute(
					span,
					"crew_agents",
					json.dumps(
						[
							{
								"id": str(agent.id),
								"role": agent.role,
								"goal": agent.goal,
								"backstory": agent.backstory,
								"verbose?": agent.verbose,
								"max_iter": agent.max_iter,
								"max_rpm": agent.max_rpm,
								"i18n": agent.i18n.prompt_file,
								"llm": json.dumps(self._safe_llm_attributes(agent.llm)),
								"delegation_enabled?": agent.allow_delegation,
								"tools_names": [
									tool.name.casefold() for tool in agent.tools or []
								],
							}
							for agent in crew.agents
						]
					),
				)
				self._add_attribute(
					span,
					"crew_tasks",
					json.dumps(
						[
							{
								"id": str(task.id),
								"description": task.description,
								"expected_output": task.expected_output,
								"async_execution?": task.async_execution,
								"human_input?": task.human_input,
								"agent_role": task.agent.role if task.agent else "None",
								"context": (
									[task.description for task in task.context]
									if task.context
									else None
								),
								"tools_names": [
									tool.name.casefold() for tool in task.tools or []
								],
							}
							for task in crew.tasks
						]
					),
				)
				return span
			except Exception:
				pass

	@override
	def end_crew(self, crew, output):
		if self.ready and crew.share_crew:
			try:
				self._add_attribute(
					crew._execution_span,
					"crewai_version",
					pkg_resources.get_distribution("crewai").version,
				)
				self._add_attribute(crew._execution_span, "crew_output", output)
				self._add_attribute(
					crew._execution_span,
					"crew_tasks_output",
					json.dumps(
						[
							{
								"id": str(task.id),
								"description": task.description,
								"output": task.output.raw_output,
							}
							for task in crew.tasks
						]
					),
				)
				crew._execution_span.set_status(Status(StatusCode.OK))
				crew._execution_span.end()
			except Exception:
				pass