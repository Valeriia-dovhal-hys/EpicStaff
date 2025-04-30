from __future__ import annotations


from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

from opentelemetry.trace import Span, Status, StatusCode



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
    def crew_creation(self, crew):
        pass

    @abstractmethod
    def task_started(self, task: Task) -> Span | None:
        pass

    @abstractmethod
    def task_ended(self, span: Span, task: Task):
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
    def crew_execution_span(self, crew: Crew, inputs: dict[str, Any] | None):
        pass

    @abstractmethod
    def end_crew(self, crew, output):
        pass