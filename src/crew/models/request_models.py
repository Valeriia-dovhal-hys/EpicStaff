from typing import Any, List, Optional
from pydantic import BaseModel, HttpUrl



class ProviderData(BaseModel):
    name: str


class LLMModelData(BaseModel):
    name: str
    comments: Optional[str] = None
    llm_provider: ProviderData
    base_url: Optional[HttpUrl] = None
    deployment: Optional[str] = None


class ConfigLLMData(BaseModel):
    temperature: float = 0.7
    num_ctx: int = 25


class EmbeddingModelData(BaseModel):
    name: str
    embedding_provider: Optional[ProviderData] = None
    deployment: Optional[str] = None
    base_url: Optional[HttpUrl] = None


class ToolData(BaseModel):
    name: str
    name_alias: str
    description: str
    requires_model: bool
    llm_model: Optional[LLMModelData] = None
    llm_config: Optional[ConfigLLMData] = None
    embedding_model: Optional[EmbeddingModelData] = None
    enabled: bool = True


class AgentData(BaseModel):
    role: str
    goal: str
    backstory: str
    tools: List[ToolData] = []
    allow_delegation: bool = False
    memory: Optional[str] = None
    max_iter: int = 25
    llm_model: Optional[LLMModelData] = None
    fcm_llm_model: Optional[LLMModelData] = None
    llm_config: Optional[ConfigLLMData] = None
    fcm_llm_config: Optional[ConfigLLMData] = None


class TemplateAgentData(BaseModel):
    role: str
    goal: str
    backstory: str
    tools: List[ToolData] = []
    allow_delegation: bool = False
    memory: Optional[str] = None
    max_iter: int = 25
    llm_model: Optional[LLMModelData] = None
    fcm_llm_model: Optional[LLMModelData] = None
    llm_config: Optional[ConfigLLMData] = None
    fcm_llm_config: Optional[ConfigLLMData] = None


class CrewData(BaseModel):
    id: int
    comments: Optional[str] = None
    name: str
    assignment: str
    agents: List[AgentData] = []
    process: str = "sequential"
    verbose: bool = False
    memory: bool = False
    embedding_model: Optional[EmbeddingModelData] = None
    manager_llm_model: Optional[LLMModelData] = None
    manager_llm_config: Optional[ConfigLLMData] = None
    tasks: List["TaskData"] | None = None


class TaskData(BaseModel):
    crew: Optional[CrewData] = None
    name: str
    agent: Optional[AgentData] = None
    instructions: str
    expected_output: str
    order: int = 1


class SessionData(BaseModel):
    id: int
    crew: Optional[CrewData] = None
    status: str
    conversation: Optional[str] = None


class SessionMessageData(BaseModel):
    session: SessionData
    text: str
    created_at: Optional[str] = None
    message_from: str
