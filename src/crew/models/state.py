import copy
from typing import Any, Literal
from typing_extensions import TypedDict
from models.dotdict import DotDict, Expression


class ReturnCodeError(Exception): ...


class StateHistoryItem(TypedDict):
    type: Literal["CREW", "PYTHON", "CONDITIONAL_EDGE", "LLM"]
    name: str
    additional_data: dict
    variables: dict  # for output
    input: Any
    output: Any


class State(TypedDict):
    state_history: list["StateHistoryItem"] = []
    variables: DotDict

