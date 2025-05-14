from rest_framework import serializers
from .models import (
    TemplateAgent,
    ConfigLLM,
    Provider,
    LLMModel,
    EmbeddingModel,
    ManagerLLMModel,
    Tool,
    EnabledTools,
    Agent,
    Crew,
    Task,
    Session,
)


class ConfigLLMSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigLLM
        fields = "__all__"


class ProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = "__all__"


class LLMModelSerializer(serializers.ModelSerializer):
    llm_provider = ProviderSerializer(read_only=True)

    class Meta:
        model = LLMModel
        fields = "__all__"


class EmbeddingModelSerializer(serializers.ModelSerializer):
    embedding_provider = ProviderSerializer(read_only=True)

    class Meta:
        model = EmbeddingModel
        fields = "__all__"


class ManagerLLMModelSerializer(serializers.ModelSerializer):
    llm_model = LLMModelSerializer(read_only=True)
    llm_config = ConfigLLMSerializer(read_only=True)

    class Meta:
        model = ManagerLLMModel
        fields = "__all__"


class ToolSerializer(serializers.ModelSerializer):
    llm_model = LLMModelSerializer(read_only=True)
    llm_config = ConfigLLMSerializer(read_only=True)

    embedding_model = EmbeddingModelSerializer(read_only=True)

    class Meta:
        model = Tool
        fields = "__all__"


class EnabledToolsSerializer(serializers.ModelSerializer):
    tools = ToolSerializer(many=True, read_only=True)

    class Meta:
        model = EnabledTools
        fields = "__all__"


class AgentSerializer(serializers.ModelSerializer):
    tools = ToolSerializer(many=True, read_only=True)
    llm_model = LLMModelSerializer(read_only=True)
    llm_config = ConfigLLMSerializer(read_only=True)

    fcm_llm_model = LLMModelSerializer(read_only=True)
    fcm_llm_config = ConfigLLMSerializer(read_only=True)

    class Meta:
        model = Agent
        fields = "__all__"


class TemplateAgentSerializer(serializers.ModelSerializer):
    agent = AgentSerializer(read_only=True)

    class Meta:
        model = TemplateAgent
        fields = "__all__"


class CrewSerializer(serializers.ModelSerializer):
    agents = AgentSerializer(many=True, read_only=True)
    embedding_model = EmbeddingModelSerializer(read_only=True)
    manager_llm_model = ManagerLLMModelSerializer(read_only=True)
    manager_llm_config = ConfigLLMSerializer(read_only=True)

    class Meta:
        model = Crew
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    crew = CrewSerializer(read_only=True)
    agent = AgentSerializer(read_only=True)

    class Meta:
        model = Task
        fields = "__all__"


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["crew", "status"]
