from django_filters import rest_framework as filters
from tables.models.llm_models import (
    RealtimeConfig,
    RealtimeTranscriptionConfig,
    RealtimeTranscriptionModel,
)
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import (
    DjangoFilterBackend,
    FilterSet,
    CharFilter,
    NumberFilter,
)
from rest_framework import viewsets, mixins
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.db import transaction
from tables.models.graph_models import LLMNode
from tables.models.realtime_models import (
    RealtimeSessionItem,
    RealtimeAgent,
    RealtimeAgentChat,
)
from tables.models.tag_models import AgentTag, CrewTag, GraphTag
from tables.models.vector_models import MemoryDatabase
from utils.logger import logger
from django.db.models import IntegerField
from django.db.models.functions import Cast
from tables.serializers.model_serializers import (
    CrewTagSerializer,
    AgentTagSerializer,
    GraphTagSerializer,
    RealtimeConfigSerializer,
    RealtimeSessionItemSerializer,
    RealtimeAgentSerializer,
    RealtimeAgentChatSerializer,
    StartNodeSerializer,
)


from tables.models import (
    Agent,
    Task,
    TemplateAgent,
    ToolConfig,
    LLMConfig,
    EmbeddingModel,
    LLMModel,
    Provider,
    Crew,
    EmbeddingConfig,
    ConditionalEdge,
    CrewNode,
    Edge,
    Graph,
    GraphSessionMessage,
    PythonCode,
    PythonCodeResult,
    PythonCodeTool,
    PythonNode,
    RealtimeModel,
    StartNode,
)

from tables.models import (
    AgentSessionMessage,
    TaskSessionMessage,
    UserSessionMessage,
    SourceCollection,
    DocumentMetadata,
)

from tables.serializers.model_serializers import (
    AgentSessionMessageSerializer,
    ConditionalEdgeSerializer,
    CrewNodeSerializer,
    EdgeSerializer,
    GraphSerializer,
    GraphSessionMessageSerializer,
    LLMNodeSerializer,
    MemorySerializer,
    PythonCodeResultSerializer,
    PythonCodeSerializer,
    PythonCodeToolSerializer,
    PythonNodeSerializer,
    TaskSessionMessageSerializer,
    TemplateAgentSerializer,
    LLMConfigSerializer,
    ProviderSerializer,
    LLMModelSerializer,
    EmbeddingModelSerializer,
    EmbeddingConfigSerializer,
    AgentSerializer,
    CrewSerializer,
    TaskSerializer,
    ToolConfigSerializer,
    UserSessionMessageSerializer,
    RealtimeModelSerializer,
    RealtimeTranscriptionConfigSerializer,
    RealtimeTranscriptionModelSerializer,
)

from tables.serializers.knowledge_serializers import (
    SourceCollectionReadSerializer,
    UploadSourceCollectionSerializer,
    UpdateSourceCollectionSerializer,
    AddSourcesSerializer,
    DocumentMetadataSerializer,
)
from tables.services.redis_service import RedisService


redis_service = RedisService()


class BasePredefinedRestrictedViewSet(ModelViewSet):
    """
    Base ViewSet class for predefined models.
    """

    def get_queryset(self):
        if self.action in ["list", "retrieve"]:
            return self.queryset
        return self.queryset.filter(predefined=False)

    def perform_create(self, serializer):
        if serializer.validated_data.get("predefined", False):
            e = f"Attempt to create predefined {self.queryset.model.__name__.lower()}"
            logger.error(e)
            raise PermissionDenied(e)
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.predefined:
            e = f"Attempt to update predefined {self.queryset.model.__name__.lower()}"
            logger.error(e)
            raise PermissionDenied(e)
        if serializer.validated_data.get("predefined", False):
            e = f"Attempt to update predefined field in {self.queryset.model.__name__.lower()}"
            logger.error(e)
            raise PermissionDenied(e)
        serializer.save()


class TemplateAgentReadWriteViewSet(ModelViewSet):
    queryset = TemplateAgent.objects.all()
    serializer_class = TemplateAgentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = serializer_class.Meta.fields


class LLMConfigReadWriteViewSet(ModelViewSet):
    class LLMConfigFilter(filters.FilterSet):
        model_provider_id = filters.CharFilter(
            field_name="model__llm_provider__id", lookup_expr="icontains"
        )

        class Meta:
            model = LLMConfig
            fields = [
                "custom_name",
                "model",
                "is_visible",
            ]

    queryset = LLMConfig.objects.all()
    serializer_class = LLMConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = LLMConfigFilter


class ProviderReadWriteViewSet(ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["name"]


class LLMModelReadWriteViewSet(BasePredefinedRestrictedViewSet):
    queryset = LLMModel.objects.all()
    serializer_class = LLMModelSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = serializer_class.Meta.fields


class EmbeddingModelReadWriteViewSet(BasePredefinedRestrictedViewSet):
    queryset = EmbeddingModel.objects.all()
    serializer_class = EmbeddingModelSerializer
    filter_backends = [DjangoFilterBackend]

    filterset_fields = serializer_class.Meta.fields


class EmbeddingConfigReadWriteViewSet(ModelViewSet):

    class EmbeddingConfigFilter(filters.FilterSet):
        model_provider_id = filters.CharFilter(
            field_name="model__embedding_provider__id", lookup_expr="icontains"
        )

        class Meta:
            model = EmbeddingConfig
            fields = [
                "custom_name",
                "model",
                "is_visible",
            ]

    queryset = EmbeddingConfig.objects.all()
    serializer_class = EmbeddingConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = EmbeddingConfigFilter


class AgentReadWriteViewSet(ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "configured_tools",
        "python_code_tools",
        "memory",
        "allow_delegation",
        "cache",
        "allow_code_execution",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        crew_id = self.request.query_params.get("crew_id")

        if crew_id is not None:
            queryset = queryset.filter(crew__id=crew_id)

        return queryset


class CrewReadWriteViewSet(ModelViewSet):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "description",
        "name",
        "process",
        "memory",
        "embedding_config",
        "manager_llm_config",
        "cache",
        "full_output",
        "planning",
        "planning_llm_config",
    ]


class TaskReadWriteViewSet(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "crew",
        "name",
        "agent",
        "order",
        "async_execution",
        "task_context_list",
    ]


class ToolConfigViewSet(ModelViewSet):
    queryset = ToolConfig.objects.all()
    serializer_class = ToolConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["tool", "name"]


class PythonCodeViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing PythonCode instances.
    """

    queryset = PythonCode.objects.all()
    serializer_class = PythonCodeSerializer


class PythonCodeToolViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing PythonCodeTool instances.
    """

    queryset = PythonCodeTool.objects.all()
    serializer_class = PythonCodeToolSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["name", "python_code"]


class PythonCodeResultReadViewSet(ReadOnlyModelViewSet):
    queryset = PythonCodeResult.objects.all()
    serializer_class = PythonCodeResultSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["execution_id", "returncode"]


class GraphViewSet(viewsets.ModelViewSet):
    queryset = Graph.objects.all()
    serializer_class = GraphSerializer


class CrewNodeViewSet(viewsets.ModelViewSet):
    queryset = CrewNode.objects.all()
    serializer_class = CrewNodeSerializer


class PythonNodeViewSet(viewsets.ModelViewSet):
    queryset = PythonNode.objects.all()
    serializer_class = PythonNodeSerializer


class LLMNodeViewSet(viewsets.ModelViewSet):
    queryset = LLMNode.objects.all()
    serializer_class = LLMNodeSerializer


class EdgeViewSet(viewsets.ModelViewSet):
    queryset = Edge.objects.all()
    serializer_class = EdgeSerializer


class ConditionalEdgeViewSet(viewsets.ModelViewSet):
    queryset = ConditionalEdge.objects.all()
    serializer_class = ConditionalEdgeSerializer


class GraphSessionMessageReadOnlyViewSet(ReadOnlyModelViewSet):
    queryset = GraphSessionMessage.objects.all()
    serializer_class = GraphSessionMessageSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["session_id"]


class SourceCollectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SourceCollection.

    - GET: all collections.
    - GET: collection by id.
    - POST: create a collection with multiple file uploads.
    - PATCH: Update allowed fields (collection_name, chunk_strategy, chunk_size, chunk_overlap).
    - DELETE: Delete a collection (and its related documents).

    Custom action:
    - PATCH: /add-sources/ endpoint to add new documents to an existing collection.
    """

    http_method_names = ["get", "post", "patch", "delete"]

    queryset = SourceCollection.objects.all()

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return SourceCollectionReadSerializer
        elif self.action in ["partial_update", "update"]:
            return UpdateSourceCollectionSerializer
        return UploadSourceCollectionSerializer

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            collection = serializer.save()

            redis_service.publish_source_collection(
                collection_id=collection.collection_id
            )
        return Response(
            SourceCollectionReadSerializer(collection).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        """
        Only allow updating collection_name.
        """
        instance = self.get_object()
        serializer = UpdateSourceCollectionSerializer(
            instance, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Collection deleted successfully"},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"], url_path="add-sources")
    def add_sources(self, request, pk=None):
        """
        Custom action to add new documents (files) to an existing collection.
        Accepts multipart/form-data with a "files" field.
        """
        collection = self.get_object()
        serializer = AddSourcesSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.create_documents(collection)

                redis_service.publish_add_source(collection_id=collection.collection_id)

            read_serializer = SourceCollectionReadSerializer(collection)
            return Response(read_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentMetadataViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentMetadata.objects.all()
    serializer_class = DocumentMetadataSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {
                "message": f"Source '{instance.file_name}' from colection '{instance.source_collection.collection_name}' deleted successfully"
            },
            status=status.HTTP_200_OK,
        )


class MemoryFilter(FilterSet):
    run_id = NumberFilter(method="filter_run_id")
    agent_id = CharFilter(field_name="payload__agent_id", lookup_expr="exact")
    user_id = CharFilter(field_name="payload__user_id", lookup_expr="exact")
    type = CharFilter(field_name="payload__type", lookup_expr="exact")

    class Meta:
        model = MemoryDatabase
        fields = ["run_id", "agent_id", "user_id", "type"]

    def filter_run_id(self, queryset, name, value):
        return queryset.annotate(
            run_id_int=Cast("payload__run_id", IntegerField())
        ).filter(run_id_int=value)


class MemoryViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):

    queryset = MemoryDatabase.objects.all()
    serializer_class = MemorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = MemoryFilter


class CrewTagViewSet(viewsets.ModelViewSet):
    queryset = CrewTag.objects.all()
    serializer_class = CrewTagSerializer


class AgentTagViewSet(viewsets.ModelViewSet):
    queryset = AgentTag.objects.all()
    serializer_class = AgentTagSerializer


class GraphTagViewSet(viewsets.ModelViewSet):
    queryset = GraphTag.objects.all()
    serializer_class = GraphTagSerializer


class RealtimeModelViewSet(viewsets.ModelViewSet):
    queryset = RealtimeModel.objects.all()
    serializer_class = RealtimeModelSerializer


class RealtimeConfigModelViewSet(viewsets.ModelViewSet):
    class RealtimeConfigFilter(filters.FilterSet):
        model_provider_id = filters.CharFilter(
            field_name="realtime_model__provider__id", lookup_expr="icontains"
        )

        class Meta:
            model = RealtimeConfig
            fields = [
                "custom_name",
                "realtime_model",
            ]

    queryset = RealtimeConfig.objects.all()
    serializer_class = RealtimeConfigSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = RealtimeConfigFilter

class RealtimeTranscriptionModelViewSet(viewsets.ModelViewSet):
    queryset = RealtimeTranscriptionModel.objects.all()
    serializer_class = RealtimeTranscriptionModelSerializer


class RealtimeTranscriptionConfigModelViewSet(viewsets.ModelViewSet):
    class RealtimeTranscriptionConfigFilter(filters.FilterSet):
        model_provider_id = filters.CharFilter(
            field_name="realtime_transcription_model__provider__id", lookup_expr="icontains"
        )

        class Meta:
            model = RealtimeTranscriptionConfig
            fields = [
                "custom_name",
                "realtime_transcription_model",
            ]
    queryset = RealtimeTranscriptionConfig.objects.all()
    serializer_class = RealtimeTranscriptionConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = RealtimeTranscriptionConfigFilter


class RealtimeSessionItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RealtimeSessionItem.objects.all()
    serializer_class = RealtimeSessionItemSerializer


class RealtimeAgentViewSet(viewsets.ModelViewSet):
    queryset = RealtimeAgent.objects.all()
    serializer_class = RealtimeAgentSerializer


class RealtimeAgentChatViewSet(ReadOnlyModelViewSet):
    """
    ViewSet for reading and deleting RealtimeAgentChat instances.
    """

    queryset = RealtimeAgentChat.objects.all()
    serializer_class = RealtimeAgentChatSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["rt_agent"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"detail": "Deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )

class StartNodeModelViewSet(viewsets.ModelViewSet):
    queryset = StartNode.objects.all()
    serializer_class = StartNodeSerializer
