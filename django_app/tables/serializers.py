from rest_framework import serializers
from .models import (
    Provider,
    LLMModel,
    EmbeddingModel,
    ManagerLLMModel,
    Tool,
    EnabledTools,
    Agent,
    Crew,
    Task,
)


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


class ManagerLLMModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagerLLMModel
        fields = "__all__"


class ToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = "__all__"


class EnabledToolsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnabledTools
        fields = "__all__"


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = "__all__"


class CrewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crew
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"
