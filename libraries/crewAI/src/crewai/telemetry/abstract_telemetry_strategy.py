from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any, Optional

from opentelemetry.trace import Span

if TYPE_CHECKING:
    from crewai.crew import Crew
    from crewai.task import Task

class AbstractTelemetryStrategy(ABC):
    
    def _safe_llm_attributes(self, llm):

        attributes = ["name", "model_name", "base_url", "model", "top_k", "temperature"]
        if llm:
            safe_attributes = {k: v for k, v in vars(llm).items() if k in attributes}
            safe_attributes["class"] = llm.__class__.__name__
            return safe_attributes
        return {}

    def _add_attribute(self, span, key, value):
        """Add an attribute to a span."""

        try:
            return span.set_attribute(key, value)
        except Exception:
            pass


    @abstractmethod
    def set_tracer(self):
        pass


    @abstractmethod
    def crew_creation(self, crew, inputs):
        pass


    @abstractmethod
    def task_started(self, crew: Crew, task: Task) -> Span | None:
        pass


    @abstractmethod
    def task_ended(self, span: Span, task: Task, crew: Crew):
        pass


    @abstractmethod
    def tool_repeated_usage(self, llm: Any, tool_name: str, attempts: int):
        pass


    @abstractmethod
    def tool_usage(self, llm: Any, tool_name: str, attempts: int):
        pass


    @abstractmethod
    def tool_usage_error(self, llm: Any):
        pass

    @abstractmethod
    def individual_test_result_span(self, crew: Crew, quality: float, exec_time: int, model_name: str):
        pass


    @abstractmethod
    def test_execution_span(
        self,
        crew: Crew,
        iterations: int,
        inputs: dict[str, Any] | None,
        model_name: str,
    ):
        pass


    @abstractmethod
    def deploy_signup_error_span(self):
        pass


    @abstractmethod
    def start_deployment_span(self, uuid: Optional[str] = None):
        pass

    
    @abstractmethod
    def create_crew_deployment_span(self):
        pass


    @abstractmethod
    def get_crew_logs_span(self, uuid: Optional[str], log_type: str = "deployment"):
        pass


    @abstractmethod
    def remove_crew_span(self, uuid: Optional[str] = None):
        pass

    @abstractmethod
    def crew_execution_span(self, crew: Crew, inputs: dict[str, Any] | None):
        pass

    @abstractmethod
    def end_crew(self, crew, final_string_output):
        pass