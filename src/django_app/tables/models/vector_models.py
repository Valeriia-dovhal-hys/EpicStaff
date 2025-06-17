from django.db import models
import uuid
from pgvector.django import VectorField
from pgvector.django import HnswIndex


class MemoryDatabase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vector = VectorField(
        dimensions=1536,
        null=True,
        blank=True,
    )
    payload = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            HnswIndex(
                name="vector_index",
                fields=["vector"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            )
        ]
