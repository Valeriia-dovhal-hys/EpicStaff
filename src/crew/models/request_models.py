from typing import Any, List, Optional, Union
from pydantic import BaseModel, HttpUrl


class ToolData(BaseModel):
    name_alias: str
    requires_model: bool
    tool_config: "ToolConfig"


class LLMConfig(BaseModel):
    model: str
    stream: bool = True
    timeout: float | int | None = None
    temperature: float | None = None
    top_p: float | None = None
    n: int | None = None
    stop: str | list[str] | None = None
    max_completion_tokens: int | None = None
    max_tokens: int | None = None
    presence_penalty: float | None = None
    frequency_penalty: float | None = None
    logit_bias: dict[int, float] | None = None
    response_format: dict[str, Any] | None = None
    seed: int | None = None
    logprobs: bool | None = None
    top_logprobs: int | None = None
    base_url: str | None = None
    api_version: str | None = None
    api_key: str | None = None


class EmbedderConfig(BaseModel):
    model: str
    deployment_name: str | None = None
    base_url: HttpUrl | None = None
    api_key: str | None = None


class LLMData(BaseModel):
    provider: str
    config: LLMConfig


class EmbedderData(BaseModel):
    provider: str
    config: EmbedderConfig


class ToolConfig(BaseModel):
    llm: LLMData | None = None
    embedder: EmbedderData | None = None


class RunToolParamsModel(BaseModel):
    tool_config: ToolConfig | None = None
    run_args: list[str]
    run_kwargs: dict[str, Any]


class AgentData(BaseModel):
    role: str
    goal: str
    backstory: str
    tools: List[ToolData] = []
    allow_delegation: bool = False
    memory: bool = False
    max_iter: int = 25
    llm: LLMData | None = None
    embedder: EmbedderData | None = None
    function_calling_llm: LLMData | None


class CrewData(BaseModel):
    id: int
    name: str
    assignment: str = ""
    agents: List[AgentData] = []
    process: str = "sequential"
    memory: bool = False
    tasks: List["TaskData"] | None = None
    manager_llm: LLMData | None = None
    embedder: EmbedderData | None = None


class TaskData(BaseModel):
    crew: CrewData
    name: str
    agent: AgentData | None = None
    instructions: str
    expected_output: str
    order: int = 1


class SessionData(BaseModel):
    id: int
    crew: CrewData | None = None
    status: str


class SessionMessageData(BaseModel):
    session: SessionData
    text: str
    created_at: Optional[str] = None
    message_from: str
