from rest_framework import viewsets
from rest_framework import mixins, viewsets
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend

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


class TemplateAgentReadWriteViewSet(ModelViewSet):
    queryset = TemplateAgent.objects.all()
    serializer_class = TemplateAgentSerializer


class ConfigLLMReadWriteViewSet(ModelViewSet):
    queryset = ConfigLLM.objects.all()
    serializer_class = ConfigLLMSerializer


class ProviderReadWriteViewSet(ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer


class LLMModelReadWriteViewSet(ModelViewSet):
    queryset = LLMModel.objects.all()
    serializer_class = LLMModelSerializer


class EmbeddingModelReadWriteViewSet(ModelViewSet):
    queryset = EmbeddingModel.objects.all()
    serializer_class = EmbeddingModelSerializer


class ToolReadWriteViewSet(ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer


class AgentReadWriteViewSet(ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_flelds = ['crew__id']


class CrewReadWriteViewSet(ModelViewSet):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer


class TaskReadWriteViewSet(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_flelds = ['crew__id']
