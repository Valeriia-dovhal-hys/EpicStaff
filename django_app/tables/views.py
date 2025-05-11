from drf_yasg import openapi
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema


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
    Session,
)
from .serializers import (
    AnswerToLLMSerializer,
    SessionStatusSerializer,
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
    GetUpdatesSerializer,
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

    @swagger_auto_schema(
        request_body=RunCrewSerializer,
        responses={
            201: openapi.Response(
                description="Session Created",
                examples={"application/json": {"session_id": 123}},
            ),
            400: "Bad Request - Invalid Input",
        },
    )
    def post(self, request):
        serializer = RunCrewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        crew_id = serializer.validated_data["crew_id"]

        # CREATED SESSION

        new_session = Session.objects.create(
            crew_id=crew_id, status=Session.SessionStatus.RUN
        )

        return Response(
            data={"session_id": new_session.pk}, status=status.HTTP_201_CREATED
        )


class GetUpdates(APIView):
    @swagger_auto_schema(
        responses={
            200: openapi.Response(
                description="Session details retrieved successfully",
                examples={
                    "application/json": {
                        "status": "run",
                        "conversation": "Sample conversation",
                    }
                },
            ),
            404: openapi.Response(
                description="Session not found or session ID missing"
            ),
        }
    )
    def get(self, request, *args, **kwargs):

        session_id = kwargs.get("session_id", None)
        if session_id is None:
            return Response("Session id not found", status=status.HTTP_404_NOT_FOUND)

        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            return Response("Session not found", status=status.HTTP_404_NOT_FOUND)

        return Response(
            data={"status": session.status, "conversation": session.conversation},
            status=status.HTTP_200_OK,
        )


class UpdateStatus(APIView):

    @swagger_auto_schema(
        request_body=SessionStatusSerializer,
        responses={
            200: openapi.Response(description="Status updated successfully"),
            400: openapi.Response(description="Invalid data provided"),
            404: openapi.Response(
                description="Session not found or session ID missing"
            ),
        },
    )
    def patch(self, request, *args, **kwargs):

        session_id = kwargs.get("session_id", None)
        if session_id is None:
            return Response("Session id not found", status=status.HTTP_404_NOT_FOUND)

        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            return Response("Session not found", status=status.HTTP_404_NOT_FOUND)

        serializer = SessionStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data["status"]

        session.status = new_status
        session.save()

        return Response(
            status=status.HTTP_200_OK,
        )


class AnswerToLLM(APIView):

    @swagger_auto_schema(
        request_body=AnswerToLLMSerializer,
        responses={
            200: openapi.Response(
                description="Status updated successfully",
                examples={
                    "application/json": {
                        "status": "run",
                    }
                },
            ),
            400: openapi.Response(description="Invalid data provided"),
            404: openapi.Response(description="Session not found"),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = AnswerToLLMSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        session_id = serializer.validated_data["session_id"]
        answer = serializer.validated_data["answer"]
        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            return Response("Session not found", status=status.HTTP_404_NOT_FOUND)

        # business logic

        return Response(data={"status": session.status}, status=status.HTTP_200_OK)
