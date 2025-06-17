import os
from .base_embedder import BaseEmbedder
from typing import List, Optional

import cohere


class CohereEmbedder(BaseEmbedder):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):

        # dims=1536
        self.model_name = model_name or "embed-v4.0"
        self.input_type = "search_query"
        self.api_key = api_key or os.getenv("COHERE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Cohere API key must be provided via argument or 'COHERE_API_KEY' environment variable."
            )
        self.client = cohere.ClientV2(api_key)

    def embed(self, text: str) -> List[float]:
        """
        Generate an embedding for the given text using Cohere.

        Args:
            text (str): The text to embed.

        Returns:
            List[float]: The embedding vector.
        """
        text = text.replace("\n", " ")
        response = self.client.embed(
            texts=[text],
            model=self.model_name,
            input_type=self.input_type,
            embedding_types=["float"],
        )

        return response.embeddings.float_[0]
