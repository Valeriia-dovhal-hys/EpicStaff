from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status

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
)
from .serializers import (
    TemplateAgentSerializer,
    ConfigLLMSerializer,
    ProviderSerializer,
    LLMModelSerializer,
    EmbeddingModelSerializer,
    ManagerLLMModelSerializer,
    ToolSerializer,
    EnabledToolsSerializer,
    AgentSerializer,
    CrewSerializer,
    TaskSerializer,
    RunCrewSerializer,
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


class ManagerLLMModelViewSet(viewsets.ModelViewSet):
    queryset = ManagerLLMModel.objects.all()
    serializer_class = ManagerLLMModelSerializer


class ToolViewSet(viewsets.ModelViewSet):  # Fixed the typo here
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer


class EnabledToolsViewSet(viewsets.ModelViewSet):
    queryset = EnabledTools.objects.all()
    serializer_class = EnabledToolsSerializer


class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer


class CrewViewSet(viewsets.ModelViewSet):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class RunCrew(APIView):
    def post(self, request, format=None):
        serializer = RunCrewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        crew_id = serializer.validated_data["crew_id"]

        # CREATED SESSION
        session_id = 0

        return Response(data={"session_id": session_id}, status=status.HTTP_201_CREATED)
