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
    tools = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tool.objects.all(),
    )

    class Meta:
        model = Agent
        fields = "__all__"


class TemplateAgentSerializer(serializers.ModelSerializer):
    tools = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tool.objects.all()
    )
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

        fields = "__all__"

class SessionSerializer(serializers.ModelSerializer):
    crew = serializers.PrimaryKeyRelatedField(
        queryset=Crew.objects.all(),
    )

    class Meta:
        model = Session
        fields = "__all__"
