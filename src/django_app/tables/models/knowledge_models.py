from django.db import models
import uuid
from pgvector.django import VectorField


from .embedding_models import EmbeddingConfig


# Knowledge Sources and Embeddings
class SourceCollection(models.Model):
    class SourceCollectionStatus(models.TextChoices):
        """
        Status of document in SourceCollection
        """

        NEW = "new"
        PROCESSING = "processing"
        COMPLETED = "completed"
        FAILED = "failed"

    collection_id = models.AutoField(primary_key=True)
    collection_name = models.CharField(max_length=255, unique=True, blank=True)

    # TODO: change to OneToMany relation with User model after implementation auth
    user_id = models.CharField(max_length=120, default="dummy_user", blank=True)
    status = models.CharField(
        max_length=20,
        choices=SourceCollectionStatus.choices,
        default=SourceCollectionStatus.NEW,
    )

    embedder = models.ForeignKey(EmbeddingConfig, on_delete=models.SET_NULL, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.collection_name

    def _generate_unique_collection_name(self, base_name):

        existing_names = SourceCollection.objects.filter(
            user_id=self.user_id, collection_name__startswith=base_name
        ).values_list("collection_name", flat=True)

        if base_name not in existing_names:
            return base_name

        counter = 1
        while True:
            new_name = f"{base_name} ({counter})"
            if new_name not in existing_names:
                return new_name
            counter += 1

    def save(self, *args, **kwargs):
        base_name = self.collection_name or "Untitled Collection"

        if (
            not self.pk
            or self.__class__.objects.filter(pk=self.pk)
            .values_list("collection_name", flat=True)
            .first()
            != base_name
        ):
            self.collection_name = self._generate_unique_collection_name(base_name)

        super().save(*args, **kwargs)


class DocumentMetadata(models.Model):
    """
    Model to store file contents as binary (bytea).
    Files are uploaded temporarily and then processed.
    """

    class DocumentFileType(models.TextChoices):
        PDF = "pdf"
        CSV = "csv"
        DOCX = "docx"
        TXT = "txt"
        JSON = "json"
        HTML = "html"
        MD = "md"

    class DocumentChunkStrategy(models.TextChoices):
        """
        Chunk splitting stgategy for document
        """

        TOKEN = "token"
        CHAR = "character"
        MARKDOWN = "markdown"
        JSON = "json"
        HTML = "html"
        CSV = "csv"

    class DocumentStatus(models.TextChoices):
        """
        Status of document in SourceCollection
        """

        NEW = "new"
        PROCESSING = "processing"
        COMPLETED = "completed"
        FAILED = "failed"

    document_id = models.AutoField(primary_key=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(
        max_length=10, choices=DocumentFileType.choices, blank=True
    )
    chunk_strategy = models.CharField(
        max_length=20,
        choices=DocumentChunkStrategy.choices,
        default=DocumentChunkStrategy.TOKEN,
    )
    chunk_size = models.PositiveIntegerField(default=1000, blank=True)
    chunk_overlap = models.PositiveIntegerField(default=150, blank=True)
    additional_params = models.JSONField(default=dict)

    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.NEW,
    )
    source_collection = models.ForeignKey(
        SourceCollection, on_delete=models.CASCADE, related_name="document_metadata"
    )

    document_content = models.ForeignKey(
        "DocumentContent",
        on_delete=models.SET_NULL,
        null=True,
        related_name="document_metadata",
    )

    def __str__(self):
        return f"{self.file_name}"


class DocumentEmbedding(models.Model):
    embedding_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    collection = models.ForeignKey(
        SourceCollection, on_delete=models.CASCADE, related_name="embeddings_coll"
    )
    document = models.ForeignKey(
        DocumentMetadata, on_delete=models.CASCADE, related_name="embeddings_doc"
    )
    chunk_text = models.TextField()
    vector = VectorField(
        null=True, blank=True
    )  # embedding vector, with flexible dimensions
    created_at = models.DateTimeField(auto_now_add=True)


class DocumentContent(models.Model):

    content = models.BinaryField(help_text="Binary file content (max 12MB)")
