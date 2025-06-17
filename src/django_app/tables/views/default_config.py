from tables.models.crew_models import (
    DefaultAgentConfig,
    DefaultCrewConfig,
    DefaultToolConfig,
)

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from tables.models.realtime_models import DefaultRealtimeAgentConfig
from tables.serializers.default_config_serializers import (
    DefaultConfigSerializer,
    DefaultCrewConfigSerializer,
    DefaultAgentConfigSerializer,
    DefaultRealtimeAgentConfigSerializer,
    DefaultToolConfigSerializer,
)


class BaseDefaultConfigAPIView(APIView):
    """A Base model for all default config api views."""

    model = None
    serializer = None

    def get_object(self):
        return get_object_or_404(self.model, pk=1)

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = self.serializer(obj, many=False)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = self.serializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DefaultConfigAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="Get default config",
        responses={
            200: openapi.Response(
                description="Default config retrieved", schema=DefaultConfigSerializer()
            ),
            404: openapi.Response(description="Not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        data = {
            "default_agent_config": DefaultAgentConfigSerializer(
                DefaultAgentConfig.load()
            ).data,
            "default_realtime_agent_config": DefaultRealtimeAgentConfigSerializer(
                DefaultRealtimeAgentConfig.load()
            ).data,
            "default_crew_config": DefaultCrewConfigSerializer(
                DefaultCrewConfig.load()
            ).data,
            "default_tool_config": DefaultToolConfigSerializer(
                DefaultToolConfig.load()
            ).data,
        }
        serializer = DefaultConfigSerializer(data)
        return Response(serializer.data)


class DefaultRealtimeAgentConfigAPIView(BaseDefaultConfigAPIView):
    model = DefaultRealtimeAgentConfig
    serializer = DefaultRealtimeAgentConfigSerializer

    @swagger_auto_schema(
        operation_summary="Get default realtime config",
        responses={
            200: DefaultRealtimeAgentConfigSerializer,
            404: openapi.Response(description="Not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update default realtime config",
        request_body=DefaultRealtimeAgentConfigSerializer,
        responses={
            200: DefaultRealtimeAgentConfigSerializer,
            404: openapi.Response(description="Not found"),
            400: openapi.Response(description="Validation Error"),
        },
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


class DefaultAgentConfigAPIView(BaseDefaultConfigAPIView):
    model = DefaultAgentConfig
    serializer = DefaultAgentConfigSerializer

    @swagger_auto_schema(
        operation_summary="Get default agent config",
        responses={
            200: DefaultAgentConfigSerializer,
            404: openapi.Response(description="Not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update default agent config",
        request_body=DefaultAgentConfigSerializer,
        responses={
            200: DefaultAgentConfigSerializer,
            404: openapi.Response(description="Not found"),
            400: openapi.Response(description="Validation Error"),
        },
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


class DefaultCrewConfigAPIView(BaseDefaultConfigAPIView):
    model = DefaultCrewConfig
    serializer = DefaultCrewConfigSerializer

    @swagger_auto_schema(
        operation_summary="Get default crew config",
        responses={
            200: DefaultCrewConfigSerializer,
            404: openapi.Response(description="Not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update default crew config",
        request_body=DefaultCrewConfigSerializer,
        responses={
            200: DefaultCrewConfigSerializer,
            404: openapi.Response(description="Not found"),
            400: openapi.Response(description="Validation Error"),
        },
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


class DefaultToolConfigAPIView(BaseDefaultConfigAPIView):
    model = DefaultToolConfig
    serializer = DefaultToolConfigSerializer

    @swagger_auto_schema(
        operation_summary="Get default tool config",
        responses={
            200: DefaultToolConfigSerializer,
            404: openapi.Response(description="Not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update default tool config",
        request_body=DefaultToolConfigSerializer,
        responses={
            200: DefaultToolConfigSerializer,
            404: openapi.Response(description="Not found"),
            400: openapi.Response(description="Validation Error"),
        },
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
