from drf_yasg import openapi
from rest_framework.views import APIView
from rest_framework import generics

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from django.core.paginator import Paginator, EmptyPage

from tables.services.session_manager_service import SessionManagerService
from tables.services.registry_container_service import RegistryContainerService
from tables.services.crew_runner_service import CrewRunnerService


from tables.models import (
    SessionMessage,
    Session,
)
from tables.serializers.serializers import (
    AnswerToLLMSerializer,
    RunCrewSerializer,
)
from tables.serializers.nested_model_serializers import NestedSessionSerializer, SessionMessageSerializer


session_manager_service = SessionManagerService()
registry_container_service = RegistryContainerService(base_url="http://localhost:8001")
crew_runner_service = CrewRunnerService(
    session_manager_service=session_manager_service,
    registry_container_service=registry_container_service,
)


class SessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Session.objects.all()
    serializer_class = NestedSessionSerializer


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

        session_id = crew_runner_service.run_crew(crew_id=crew_id)

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
