from rest_framework import viewsets
from rest_framework import mixins, viewsets
from rest_framework.viewsets import ModelViewSet

from tables.models import (
    TemplateAgent,
    ConfigLLM,
    Provider,
    LLMModel,
    EmbeddingModel,
    Tool,
    Agent,
    Crew,
    Task,
)
from tables.serializers.nested_model_serializers import (
    NestedTemplateAgentSerializer,
    NestedConfigLLMSerializer,
    NestedProviderSerializer,
    NestedLLMModelSerializer,
    NestedEmbeddingModelSerializer,
    NestedToolSerializer,
    NestedAgentSerializer,
    NestedCrewSerializer,
    NestedTaskSerializer,
)
from tables.serializers.model_serializers import (
    TemplateAgentSerializer,
    ConfigLLMSerializer,
    ProviderSerializer,
    LLMModelSerializer,
    EmbeddingModelSerializer,
    ToolSerializer,
    AgentSerializer,
    CrewSerializer,
    TaskSerializer,
)


class ReadWriteModelViewSet(ModelViewSet):

    read_serializer_class = NestedTemplateAgentSerializer
    write_serializer_class = TemplateAgentSerializer

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return self.write_serializer_class
        return self.read_serializer_class


class TemplateAgentReadWriteViewSet(ReadWriteModelViewSet):
    queryset = TemplateAgent.objects.all()

    read_serializer_class = NestedTemplateAgentSerializer
    write_serializer_class = TemplateAgentSerializer


class ConfigLLMReadWriteViewSet(ReadWriteModelViewSet):
    queryset = ConfigLLM.objects.all()

    read_serializer_class = NestedConfigLLMSerializer
    write_serializer_class = ConfigLLMSerializer


class ProviderReadWriteViewSet(ReadWriteModelViewSet):
    queryset = Provider.objects.all()

    read_serializer_class = NestedProviderSerializer
    write_serializer_class = ProviderSerializer


class LLMModelReadWriteViewSet(ReadWriteModelViewSet):
    queryset = LLMModel.objects.all()

    read_serializer_class = NestedLLMModelSerializer
    write_serializer_class = LLMModelSerializer


class EmbeddingModelReadWriteViewSet(ReadWriteModelViewSet):
    queryset = EmbeddingModel.objects.all()
    read_serializer_class = NestedEmbeddingModelSerializer
    write_serializer_class = EmbeddingModelSerializer


class ToolReadWriteViewSet(ReadWriteModelViewSet):
    queryset = Tool.objects.all()

    read_serializer_class = NestedToolSerializer
    write_serializer_class = ToolSerializer


class AgentReadWriteViewSet(ReadWriteModelViewSet):
    queryset = Agent.objects.all()

    read_serializer_class = NestedAgentSerializer
    write_serializer_class = AgentSerializer


class CrewReadWriteViewSet(ReadWriteModelViewSet):
    queryset = Crew.objects.all()

    read_serializer_class = NestedCrewSerializer
    write_serializer_class = CrewSerializer


class TaskReadWriteViewSet(ReadWriteModelViewSet):
    queryset = Task.objects.all()

    read_serializer_class = NestedTaskSerializer
    write_serializer_class = TaskSerializer
