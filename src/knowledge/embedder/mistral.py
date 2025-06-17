import os
from typing import List, Optional
from .base_embedder import BaseEmbedder

from mistralai import Mistral


class MistralEmbedder(BaseEmbedder):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        # dims=1024
        self.model_name = model_name or "mistral-embed"
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Cohere API key must be provided via argument or 'MISTRAL_API_KEY' environment variable."
            )
        self.client = Mistral(api_key=self.api_key)

    def embed(self, text: str) -> List[float]:
        """
        Generate an embedding for the given text using MistralAI.

        Args:
            text (str): The text to embed.

        Returns:
            List[float]: The embedding vector.
        """
        text = text.replace("\n", " ")
        response = self.client.embeddings.create(model=self.model_name, inputs=[text])

        return response.data[0].embedding
