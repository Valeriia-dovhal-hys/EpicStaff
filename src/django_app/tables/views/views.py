from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator, EmptyPage

from tables.services.config_service import YamlConfigService
from tables.services.session_manager_service import SessionManagerService
from tables.services.crew_service import CrewService
from tables.services.redis_service import RedisService


from tables.models import (
    SessionMessage,
    Session,
)
from tables.serializers.model_serializers import SessionSerializer
from tables.serializers.serializers import (
    AnswerToLLMSerializer,
    EnvironmentConfigSerializer,
    RunCrewSerializer,
    ToolAliasSerializer,
)
from tables.serializers.nested_model_serializers import (
    NestedSessionSerializer,
    SessionMessageSerializer,
)

redis_service = RedisService()
crew_service = CrewService()
session_manager_service = SessionManagerService(
    redis_service=redis_service,
    crew_service=crew_service,
)
config_service = YamlConfigService()


class SessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer


class SessionMessageListView(generics.ListAPIView):
    serializer_class = SessionMessageSerializer

    def get_queryset(self):
        session_id = self.kwargs["session_id"]
        return SessionMessage.objects.filter(session_id=session_id)


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

        session_id = session_manager_service.create_session(crew_id=crew_id)

        session_manager_service.session_run_crew(session_id=session_id)

        return Response(data={"session_id": session_id}, status=status.HTTP_201_CREATED)


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
            session_status = session_manager_service.get_session_status(
                session_id=session_id
            )
        except Session.DoesNotExist:
            return Response("Session not found", status=status.HTTP_404_NOT_FOUND)

        return Response(
            data={"status": session_status},
            status=status.HTTP_200_OK,
        )


class StopSession(APIView):

    @swagger_auto_schema(
        responses={
            204: openapi.Response(description="Session stoped"),
            404: openapi.Response(
                description="Session not found or session ID missing"
            ),
        },
    )
    def post(self, request, *args, **kwargs):
        session_id = kwargs.get("session_id", None)
        if session_id is None:
            return Response("Session id is missing", status=status.HTTP_404_NOT_FOUND)

        try:
            session_manager_service.stop_session(session_id=session_id)
        except Session.DoesNotExist:
            return Response("Session not found", status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)


class EnviromentConfig(APIView):
    @swagger_auto_schema(
        responses={
            200: openapi.Response(
                description="Config retrieved successfully",
                examples={"application/json": {"data": {"key": "value"}}},
            ),
        },
    )
    def get(self, request, format=None):

        config_dict: dict = config_service.get_all()

        return Response(status=status.HTTP_200_OK, data={"data": config_dict})

    @swagger_auto_schema(
        request_body=EnvironmentConfigSerializer,
        responses={
            200: openapi.Response(
                description="Config updated successfully",
                examples={"application/json": {"data": {"key": "value"}}},
            ),
            400: openapi.Response(description="Invalid config data provided"),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = EnvironmentConfigSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        config_service.set_all(config_dict=serializer.validated_data["data"])

        return Response(
            data={"data": config_service.get_all()}, status=status.HTTP_200_OK
        )


@swagger_auto_schema(
    method="delete",
    responses={
        204: openapi.Response(description="Config deleted successfully"),
        400: openapi.Response(description="Invalid config data provided"),
    },
)
@api_view(["DELETE"])
def delete_environment_config(request, *args, **kwargs):
    key: str | None = kwargs.get("key", None)
    if key is None:
        return Response("Key not found", status=status.HTTP_404_NOT_FOUND)

    config_service.delete(key=key)
    return Response("Config deleted successfully", status=status.HTTP_204_NO_CONTENT)


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

        # TODO: business logic

        return Response(data={"status": session.status}, status=status.HTTP_200_OK)


@swagger_auto_schema(method="get", responses={200: ToolAliasSerializer(many=True)})
@api_view(["GET"])
def getToolAliases(request):
    json_data = redis_service.loadToolAliases()
    return Response(json_data)
