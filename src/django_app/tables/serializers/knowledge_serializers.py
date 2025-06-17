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
    additional_params = serializers.ListField(
        child=serializers.JSONField(),
        allow_empty=False,
        write_only=True,
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
            "additional_params",
        ]
        read_only_fields = ["collection_id", "created_at", "status"]

        extra_kwargs = {
            "collection_name": {"validators": []},
        }

    def validate_files(self, value):
        return self.validate_files_list(value)

    def validate(self, attrs):
        return self.validate_list_lengths(attrs)

    def create(self, validated_data):
        files = validated_data.pop("files")
        chunk_sizes = validated_data.pop("chunk_sizes")
        chunk_strategies = validated_data.pop("chunk_strategies")
        chunk_overlaps = validated_data.pop("chunk_overlaps")
        additional_params = validated_data.pop("additional_params")

        with transaction.atomic():
            collection = SourceCollection.objects.create(**validated_data)
            self.create_documents_for_collection(
                collection=collection,
                files=files,
                chunk_sizes=chunk_sizes,
                chunk_strategies=chunk_strategies,
                chunk_overlaps=chunk_overlaps,
                raw_additional_params=additional_params,
            )
        return collection


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
    additional_params = serializers.ListField(
        child=serializers.JSONField(), allow_empty=False, write_only=True
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
        additional_params = self.validated_data.pop("additional_params")
        self.create_documents_for_collection(
            collection=collection,
            files=files,
            chunk_sizes=chunk_sizes,
            chunk_strategies=chunk_strategies,
            chunk_overlaps=chunk_overlaps,
            raw_additional_params=additional_params,
        )


class UpdateSourceCollectionSerializer(serializers.ModelSerializer):
    """
    Serializer for updating only specific fields of a SourceCollection.
    """

    class Meta:
        model = SourceCollection
        fields = ["collection_name"]
        extra_kwargs = {
            "collection_name": {"validators": []},
        }


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
            "additional_params",
            "document_content",
        ]
        read_only_fields = ["document_id"]


class CopySourceCollectionSerializer(
    SourceSerializerMixin, serializers.ModelSerializer
):
    class NestedDocumentMetadataSerializer(DocumentMetadataSerializer):
        class Meta(DocumentMetadataSerializer.Meta):
            extra_kwargs = {
                "document_id": {"read_only": True},
                "source_collection": {"read_only": True},
            }

    document_metadata = NestedDocumentMetadataSerializer(many=True)

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
        read_only_fields = ["collection_id", "created_at", "status"]

        extra_kwargs = {
            "collection_name": {"validators": []},
        }

    def create(self, validated_data):
        list_document_metadata = validated_data.pop("document_metadata")
        with transaction.atomic():
            collection = SourceCollection.objects.create(**validated_data)
            self.create_copy_collection(
                collection=collection, list_document_metadata=list_document_metadata
            )
        return collection


class SourceCollectionReadSerializer(serializers.ModelSerializer):
    document_metadata = DocumentMetadataSerializer(many=True, read_only=True)

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


class CollectionStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = SourceCollection
        fields = ["collection_id", "collection_name", "collection_status"]

    def to_representation(self, obj):
        """Custom representation to control response structure"""
        document_counts = obj.document_metadata.aggregate(
            total_documents=Count("document_id"),
            new_documents=Count(
                "document_id", filter=Q(status=DocumentMetadata.DocumentStatus.NEW)
            ),
            completed_documents=Count(
                "document_id",
                filter=Q(status=DocumentMetadata.DocumentStatus.COMPLETED),
            ),
            processing_documents=Count(
                "document_id",
                filter=Q(status=DocumentMetadata.DocumentStatus.PROCESSING),
            ),
            failed_documents=Count(
                "document_id", filter=Q(status=DocumentMetadata.DocumentStatus.FAILED)
            ),
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
                    "document_id": doc["document_id"],
                    "file_name": doc["file_name"],
                    "status": doc["status"],
                }
                for doc in documents
            ],
        }
