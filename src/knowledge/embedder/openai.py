import os
from .base_embedder import BaseEmbedder
from openai import OpenAI
from typing import List


class OpenAIEmbedder(BaseEmbedder):

    def __init__(self, api_key, model_name):

        self.model_name = model_name or "text-embedding-3-small"

        api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key)

    def embed(self, text: str) -> List[float]:
        """
        Get the embedding for the given text using OpenAI.

        Args:
            text (str): The text to embed.

        Returns:
            list: The embedding vector.
        """
        text = text.replace("\n", " ")
        return (
            self.client.embeddings.create(input=[text], model=self.model_name)
            .data[0]
            .embedding
        )
