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
    collection_name = models.CharField(max_length=255, blank=True)

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

    class DocumentChunkStrategy(models.TextChoices):
        """
        Chunk splitting stgategy for document
        """

        TOKEN = "token"
        CHAR = "character"
        MARKDOWN = "markdown"
        JSON = "json"
        HTML = "html"

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

    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.NEW,
    )
    source_collection = models.ForeignKey(
        SourceCollection, on_delete=models.CASCADE, related_name="document_metadata"
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

    document_metadata = models.OneToOneField(
        DocumentMetadata, on_delete=models.CASCADE, related_name="document_content"
    )
    content = models.BinaryField(help_text="Binary file content (max 12MB)")
