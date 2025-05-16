from rest_framework import viewsets


from .models import (
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
from .model_serializers import (
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


class TemplateAgentViewSet(viewsets.ModelViewSet):
    queryset = TemplateAgent.objects.all()
    serializer_class = TemplateAgentSerializer


class ConfigLLMViewSet(viewsets.ModelViewSet):
    queryset = ConfigLLM.objects.all()
    serializer_class = ConfigLLMSerializer


class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer


class LLMModelViewSet(viewsets.ModelViewSet):
    queryset = LLMModel.objects.all()
    serializer_class = LLMModelSerializer


class EmbeddingModelViewSet(viewsets.ModelViewSet):
    queryset = EmbeddingModel.objects.all()
    serializer_class = EmbeddingModelSerializer


class ToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer


class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer


class CrewViewSet(viewsets.ModelViewSet):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
