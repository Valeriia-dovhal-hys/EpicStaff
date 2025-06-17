from rest_framework import serializers
from tables.models import SourceCollection, DocumentMetadata
from django.db import transaction
from django.db.models import Count, Q
from tables.utils.mixins import SourceSerializerMixin


ALLOWED_FILE_TYPES = {choice[0] for choice in DocumentMetadata.DocumentFileType.choices}
MAX_FILE_SIZE = 12 * 1024 * 1024  # 12MB


class UploadSourceCollectionSerializer(
    SourceSerializerMixin, serializers.ModelSerializer
):
    files = serializers.ListField(
        child=serializers.FileField(), allow_empty=False, write_only=True
    )
    chunk_sizes = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, write_only=True
    )
    chunk_strategies = serializers.ListField(
        child=serializers.ChoiceField(
            choices=DocumentMetadata.DocumentChunkStrategy.choices
        ),
        allow_empty=False,
        write_only=True,
    )
    chunk_overlaps = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, write_only=True
    )

    class Meta:
        model = SourceCollection
        fields = [
            "collection_id",
            "collection_name",
            "user_id",
            "status",
            "embedder",
            "created_at",
            "files",
            "chunk_sizes",
            "chunk_strategies",
            "chunk_overlaps",
        ]
        read_only_fields = ["collection_id", "created_at", "status"]

    def validate_files(self, value):
        return self.validate_files_list(value)

    def validate(self, attrs):
        return self.validate_list_lengths(attrs)

    def create(self, validated_data):
        files = validated_data.pop("files")
        chunk_sizes = validated_data.pop("chunk_sizes")
        chunk_strategies = validated_data.pop("chunk_strategies")
        chunk_overlaps = validated_data.pop("chunk_overlaps")
        with transaction.atomic():
            collection = SourceCollection.objects.create(**validated_data)
            self.create_documents_for_collection(
                collection, files, chunk_sizes, chunk_strategies, chunk_overlaps
            )
        return collection


class SourceCollectionReadSerializer(serializers.ModelSerializer):
    document_metadata = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = SourceCollection
        fields = [
            "collection_id",
            "collection_name",
            "user_id",
            "status",
            "embedder",
            "created_at",
            "document_metadata",
        ]
        read_only_fields = fields


class AddSourcesSerializer(SourceSerializerMixin, serializers.Serializer):
    files = serializers.ListField(
        child=serializers.FileField(), allow_empty=False, write_only=True
    )
    chunk_sizes = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, write_only=True
    )
    chunk_strategies = serializers.ListField(
        child=serializers.ChoiceField(
            choices=DocumentMetadata.DocumentChunkStrategy.choices
        ),
        allow_empty=False,
        write_only=True,
    )
    chunk_overlaps = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, write_only=True
    )

    def validate_files(self, value):
        return self.validate_files_list(value)

    def validate(self, attrs):
        return self.validate_list_lengths(attrs)

    def create_documents(self, collection):
        files = self.validated_data["files"]
        chunk_sizes = self.validated_data.pop("chunk_sizes")
        chunk_strategies = self.validated_data.pop("chunk_strategies")
        chunk_overlaps = self.validated_data.pop("chunk_overlaps")
        self.create_documents_for_collection(
            collection, files, chunk_sizes, chunk_strategies, chunk_overlaps
        )


class UpdateSourceCollectionSerializer(serializers.ModelSerializer):
    """
    Serializer for updating only specific fields of a SourceCollection.
    """

    class Meta:
        model = SourceCollection
        fields = ["collection_name"]


class DocumentMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentMetadata
        fields = [
            "document_id",
            "file_name",
            "file_type",
            "source_collection",
            "chunk_size",
            "chunk_strategy",
            "chunk_overlap",
        ]
        read_only_fields = ["document_id"]

class CollectionStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = SourceCollection
        fields = [
            "collection_id",
            "collection_name",
            "collection_status"
        ]

    def to_representation(self, obj):
        """Custom representation to control response structure"""
        document_counts = obj.document_metadata.aggregate(
            total_documents=Count("document_id"),
            new_documents=Count("document_id", filter=Q(status=DocumentMetadata.DocumentStatus.NEW)),
            completed_documents=Count("document_id", filter=Q(status=DocumentMetadata.DocumentStatus.COMPLETED)),
            processing_documents=Count("document_id", filter=Q(status=DocumentMetadata.DocumentStatus.PROCESSING)),
            failed_documents=Count("document_id", filter=Q(status=DocumentMetadata.DocumentStatus.FAILED)),

        )
        documents = obj.document_metadata.values("document_id", "file_name", "status")
        return {
            "collection_id": obj.collection_id,
            "collection_name": obj.collection_name,
            "collection_status": obj.status,
            "total_documents": document_counts["total_documents"],
            "new_documents": document_counts["new_documents"],
            "completed_documents": document_counts["completed_documents"],
            "processing_documents": document_counts["processing_documents"],
            "failed_documents": document_counts["failed_documents"],
            "documents": [
                {
                    "document_id": doc['document_id'],
                    "file_name": doc["file_name"],
                    "status": doc["status"],
                }
                for doc in documents
            ],
        }
