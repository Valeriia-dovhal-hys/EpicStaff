from rest_framework import serializers
from tables.models import (
    Session,
    Agent,
    Task,
    TemplateAgent,
    Tool,
    LLMConfig,
    EmbeddingModel,
    LLMModel,
    Provider,
    Crew,
)
from tables.models.crew_models import DefaultAgentConfig, DefaultCrewConfig


class NestedProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = "__all__"


class NestedLLMModelSerializer(serializers.ModelSerializer):
    llm_provider = NestedProviderSerializer(read_only=True)

    class Meta:
        model = LLMModel
        fields = "__all__"


class NestedConfigLLMSerializer(serializers.ModelSerializer):
    model = NestedLLMModelSerializer()

    class Meta:
        model = LLMConfig
        fields = "__all__"


class NestedLLMDefaultAgentConfigSerializer(serializers.ModelSerializer):
    default_llm_model = NestedLLMModelSerializer()
    default_llm_config = NestedConfigLLMSerializer()

    class Meta:
        model = DefaultAgentConfig
        fields = "__all__"


class NestedLLMDefaultCrewConfigSerializer(serializers.ModelSerializer):
    default_llm_model = NestedLLMModelSerializer()
    default_llm_config = NestedConfigLLMSerializer()

    class Meta:
        model = DefaultCrewConfig
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
    llm_config = serializers.SerializerMethodField()

    fcm_llm_config = NestedConfigLLMSerializer(read_only=True)

    class Meta:
        model = Agent
        fields = "__all__"

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
    manager_llm_config = serializers.SerializerMethodField()

    class Meta:
        model = Crew
        fields = "__all__"

    def get_manager_llm_config(self, obj):
        manager_llm_config = obj.get_manager_llm_config()
        if manager_llm_config:
            return NestedConfigLLMSerializer(
                manager_llm_config, context=self.context
            ).data
        return None


class NestedTaskSerializer(serializers.ModelSerializer):
    # crew = NestedCrewSerializer(read_only=True)
    agent = NestedAgentSerializer(read_only=True)

    class Meta:
        model = Task

        fields = [
            "id",
            # "crew",
            "agent",
            "name",
            "agent",
            "instructions",
            "expected_output",
            "order",
            "human_input",
        ]


class NestedSessionSerializer(serializers.ModelSerializer):
    crew = NestedCrewSerializer(read_only=True)

    class Meta:
        model = Session
        fields = "__all__"


class SessionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["status"]
