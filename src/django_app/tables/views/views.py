from utils.logger import logger

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError

from tables.services.config_service import YamlConfigService
from tables.services.session_manager_service import SessionManagerService
from tables.services.crew_service import CrewService
from tables.services.redis_service import RedisService


from tables.models import (
    SessionMessage,
    Session,
    Crew,
)
from tables.serializers.model_serializers import SessionSerializer
from tables.serializers.serializers import (
    AnswerToLLMSerializer,
    EnvironmentConfigSerializer,
    RunSessionSerializer,
)
from tables.serializers.nested_model_serializers import (
    SessionMessageSerializer,
)

redis_service = RedisService()
crew_service = CrewService()
session_manager_service = SessionManagerService()
config_service = YamlConfigService()


class SessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer


class SessionMessageListView(generics.ListAPIView):
    serializer_class = SessionMessageSerializer

    def get_queryset(self):
        session_id = self.kwargs["session_id"]
        return SessionMessage.objects.filter(session_id=session_id)
    

class RunSession(APIView):

    @swagger_auto_schema(
        request_body=RunSessionSerializer,
        responses={
            201: openapi.Response(

                description="Session Started",
                examples={"application/json": {"session_id": 123}},
            ),
            400: "Bad Request - Invalid Input",
        }
    )
    def post(self, request):
        logger.info("Received POST request to start a new session.")

        serializer = RunSessionSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Invalid data received in request: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        crew_id = serializer.validated_data["crew_id"]
        
        try:
            session_id = session_manager_service.create_session(crew_id=crew_id)
            logger.info(f"Session created with session_id: {session_id}")

            session_manager_service.run_session(session_id=session_id)
            logger.info(f"Session {session_id} successfully started.")
        except Exception as e:
            logger.error(f"Error occurred while starting session {session_id}: {str(e)}")
            Session.objects.get(id=session_id).status = Session.SessionStatus.ERROR
            return Response(data={"session_id": session_id}, status=status.HTTP_400_BAD_REQUEST)
        else:
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


class EnvironmentConfig(APIView):
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
        logger.info("Configuration retrieved successfully.")

        return Response(status=status.HTTP_200_OK, data={"data": config_dict})

    @swagger_auto_schema(
        request_body=EnvironmentConfigSerializer,
        responses={
            201: openapi.Response(
                description="Config updated successfully",
                examples={"application/json": {"data": {"key": "value"}}},
            ),
            400: openapi.Response(description="Invalid config data provided"),
        },
    )
    def post(self, request, *args, **kwargs):
        
        serializer = EnvironmentConfigSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error("Invalid configuration data provided.")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        config_service.set_all(config_dict=serializer.validated_data["data"])
        logger.info("Configuration updated successfully.")

        updated_config = config_service.get_all()
        
        return Response(
            data={"data": updated_config}, status=status.HTTP_201_CREATED
        )


@swagger_auto_schema(
    method="delete",
    responses={
        204: openapi.Response(description="Config deleted successfully"),
        400: openapi.Response(description="No key provided"),
        404: openapi.Response(description="Key not found"),
    },
)
@api_view(["DELETE"])
def delete_environment_config(request, *args, **kwargs):
    key: str | None = kwargs.get("key", None)

    if key is None:
        logger.error("No key provided in DELETE request.")
        return Response("No key provided", status=status.HTTP_400_BAD_REQUEST)
    
    deleted_key = config_service.delete(key=key)
    
    if not deleted_key:
        logger.warning(f"Key '{key}' not found.")
        return Response("Key not found", status=status.HTTP_404_NOT_FOUND)

    logger.info(f"Config key '{key}' deleted successfully.")
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
    

class CrewDeleteAPIView(APIView):

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                name="delete_sessions",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Delete all sessions associated (true/false). Default is false.",
                required=False,
            )
        ],
        responses={
            200: "Crew deleted successfully",
            400: "Invalid value for delete_sessions",
            404: "Crew not found",
        },
    )
    def delete(self, request, id):
        
        delete_sessions = request.query_params.get('delete_sessions', 'false').lower()
        if delete_sessions not in {'true', 'false'}:
            raise ValidationError({"error": "Invalid value for delete_sessions. Use 'true' or 'false'."})

        delete_sessions = delete_sessions == 'true'

        crew = Crew.objects.filter(id=id).first()
        if not crew:
            raise NotFound({"error": "Crew not found"})

        try:
            with transaction.atomic():
                if delete_sessions:
                    Session.objects.filter(crew=crew).delete()
                else:
                    Session.objects.filter(crew=crew).update(crew=None)

                crew.delete()

            return Response({"message": "Crew deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
