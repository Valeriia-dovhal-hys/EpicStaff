from rest_framework import serializers
from ..models import (
    TemplateAgent,
    ConfigLLM,
    Provider,
    LLMModel,
    EmbeddingModel,
    Tool,
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

    class Meta:
        model = LLMModel
        fields = "__all__"


class EmbeddingModelSerializer(serializers.ModelSerializer):

    class Meta:
        model = EmbeddingModel
        fields = "__all__"


class ToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = "__all__"


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = "__all__"


class TemplateAgentSerializer(serializers.ModelSerializer):

    class Meta:
        model = TemplateAgent
        fields = "__all__"


class CrewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Crew
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Task

        fields = [
            "crew",
            "name",
            "agent",
            "instructions",
            "expected_output",
            "order",
        ]


class SessionSerializer(serializers.ModelSerializer):
    crew = CrewSerializer(read_only=True)
    agent = AgentSerializer(read_only=True)

    class Meta:
        model = Session
        fields = ["crew", "status"]
