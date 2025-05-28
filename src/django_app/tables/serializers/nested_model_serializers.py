from rest_framework import serializers
from ..models import (
    SessionMessage,
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


class NestedConfigLLMSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigLLM
        fields = "__all__"


class NestedProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = "__all__"


class NestedLLMModelSerializer(serializers.ModelSerializer):
    llm_provider = NestedProviderSerializer(read_only=True)

    class Meta:
        model = LLMModel
        fields = "__all__"


class NestedEmbeddingModelSerializer(serializers.ModelSerializer):
    embedding_provider = NestedProviderSerializer(read_only=True)

    class Meta:
        model = EmbeddingModel
        fields = "__all__"


class NestedToolSerializer(serializers.ModelSerializer):
    llm_model = NestedLLMModelSerializer(read_only=True)
    llm_config = NestedConfigLLMSerializer(read_only=True)

    embedding_model = NestedEmbeddingModelSerializer(read_only=True)

    class Meta:
        model = Tool
        fields = "__all__"


class NestedAgentSerializer(serializers.ModelSerializer):
    tools = NestedToolSerializer(many=True, read_only=True)
    llm_model = NestedLLMModelSerializer(read_only=True)
    llm_config = NestedConfigLLMSerializer(read_only=True)

    fcm_llm_model = NestedLLMModelSerializer(read_only=True)
    fcm_llm_config = NestedConfigLLMSerializer(read_only=True)

    class Meta:
        model = Agent
        fields = "__all__"


class NestedTemplateAgentSerializer(serializers.ModelSerializer):
    agent = NestedAgentSerializer(read_only=True)

    class Meta:
        model = TemplateAgent
        fields = "__all__"


class NestedCrewSerializer(serializers.ModelSerializer):
    agents = NestedAgentSerializer(many=True, read_only=True)
    embedding_model = NestedEmbeddingModelSerializer(read_only=True)
    manager_llm_model = NestedLLMModelSerializer(read_only=True)
    manager_llm_config = NestedConfigLLMSerializer(read_only=True)

    class Meta:
        model = Crew
        fields = "__all__"


class NestedTaskSerializer(serializers.ModelSerializer):
    crew = NestedCrewSerializer(read_only=True)
    agent = NestedAgentSerializer(read_only=True)

    class Meta:
        model = Task

        fields = [
            "crew",
            "agent",
            "name",
            "agent",
            "instructions",
            "expected_output",
            "order",
        ]


class NestedSessionSerializer(serializers.ModelSerializer):
    crew = NestedCrewSerializer(read_only=True)

    class Meta:
        model = Session
        fields = "__all__"


class SessionMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionMessage
        fields = "__all__"


class SessionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["status"]
