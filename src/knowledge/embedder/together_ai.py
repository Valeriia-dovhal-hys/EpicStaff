import os
from typing import List
from .base_embedder import BaseEmbedder

from together import Together


class TogetherAIEmbedder(BaseEmbedder):
    def __init__(self, api_key=None, model_name=None):
        # dims=768
        self.model_name = model_name or "togethercomputer/m2-bert-80M-32k-retrieval"
        self.api_key = api_key or os.getenv("TOGETHER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Cohere API key must be provided via argument or 'TOGETHER_API_KEY' environment variable."
            )
        self.client = Together(api_key=self.api_key)

    def embed(self, text: str) -> List[float]:
        """
        Generate an embedding for the given text using TogetherAI.

        Args:
            text (str): The text to embed.

        Returns:
            List[float]: The embedding vector.
        """
        text = text.replace("\n", " ")
        response = self.client.embeddings.create(input=[text], model=self.model_name)

        return response.data[0].embedding
