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
    llm_model = serializers.SerializerMethodField()
    llm_config = serializers.SerializerMethodField()
    fcm_llm_model = serializers.SerializerMethodField()
    fcm_llm_config = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = "__all__"

    def get_llm_model(self, obj):
        llm_model = obj.get_llm_model()
        if llm_model:
            return NestedLLMModelSerializer(llm_model, context=self.context).data
        return None

    def get_llm_config(self, obj):
        llm_config = obj.get_llm_config()
        if llm_config:
            return NestedConfigLLMSerializer(llm_config, context=self.context).data
        return None


class NestedTemplateAgentSerializer(serializers.ModelSerializer):
    agent = NestedAgentSerializer(read_only=True)

    class Meta:
        model = TemplateAgent
        fields = "__all__"


class NestedCrewSerializer(serializers.ModelSerializer):
    agents = NestedAgentSerializer(many=True, read_only=True)
    embedding_model = NestedEmbeddingModelSerializer(read_only=True)
    manager_llm_model = serializers.SerializerMethodField()
    manager_llm_config = serializers.SerializerMethodField()

    class Meta:
        model = Crew
        fields = "__all__"

    def get_manager_llm_model(self, obj):
        manager_llm_model = obj.get_manager_llm_model()
        if manager_llm_model:
            return NestedLLMModelSerializer(manager_llm_model, context=self.context).data
        return None

    def get_manager_llm_config(self, obj):
        manager_llm_config = obj.get_manager_llm_config()
        if manager_llm_config:
            return NestedConfigLLMSerializer(manager_llm_config, context=self.context).data
        return None


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
