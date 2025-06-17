import os
from loguru import logger
import cachetools

from storage.knowledge_storage import KnowledgeStorage
from utils.extract_knowledge_context import extract_knowledge_context
from chunkers.token_chunker import TokenChunker
from chunkers.markdown_chunker import MarkdownChunker
from chunkers.character_chunker import CharacterChunker
from chunkers.json_chunker import JSONChunker
from chunkers.html_chunker import HTMLChunker
from settings import Status
from embedder.openai import OpenAIEmbedder

from dotenv import load_dotenv

load_dotenv()


def get_required_env_var(key: str) -> str:
    """
    If you see this error during local launch set all required variables in /knowledge/.env
    """
    value = os.getenv(key)
    if value is None:
        raise ValueError(f"Missing required environment variable: {key}")
    return value


POSTGRES_KNOWLEDGE_CONFIG = {
    "dbname": get_required_env_var("DB_NAME"),
    "user": get_required_env_var("DB_USER"),
    "password": get_required_env_var("DB_PASSWORD"),
    "port": get_required_env_var("DB_PORT"),
    "host": get_required_env_var("DB_HOST_NAME"),
}

_embedder_cache = cachetools.LRUCache(maxsize=50)


class CollectionProcessor:
    def __init__(self, collection_id):
        self.collection_id = collection_id
        self.storage = KnowledgeStorage(**POSTGRES_KNOWLEDGE_CONFIG)
        self.embedder = self._get_cached_embedder()

    def _get_cached_embedder(self):
        """Retrieve embedder from cache or initialize it if not cached."""
        if self.collection_id in _embedder_cache:
            return _embedder_cache[self.collection_id]

        logger.info(f"Initializing embedder for collection {self.collection_id}")
        embedder_config = self.storage.get_embedder_configuration(self.collection_id)
        embedder = self._set_embedder_config(embedder_config)

        _embedder_cache[self.collection_id] = embedder
        return embedder

    def search(self, uuid, query, search_limit, distance_threshold):
        embedded_query = self.embedder.embed(query)
        knowledge_snippets = self.storage.search(
            embedded_query=embedded_query,
            collection_id=self.collection_id,
            limit=search_limit,
            distance_threshold=distance_threshold,
        )
        results = extract_knowledge_context(knowledge_snippets)

        return {"uuid": uuid, "collection_id": self.collection_id, "results": results}

    def process_collection(self):

        self.storage.update_collection_status(Status.PROCESSING, self.collection_id)

        try:
            documents = self.storage.get_documents(self.collection_id)
            for (
                document_id,
                file_name,
                binary_content,
                chunk_strategy,
                chunk_size,
                chunk_overlap,
            ) in documents:
                try:
                    self.storage.update_document_status(Status.PROCESSING, document_id)
                    text = self._get_text_content(binary_content)
                    chunker = self._get_chunk_strategy(
                        chunk_strategy, chunk_size, chunk_overlap
                    )

                    chunks = chunker.chunk(text)
                    for chunk in chunks:
                        # TODO: Change this. prompt eng
                        if file_name.split(".")[-1].lower() == "csv":
                            chunk = f"File name: {file_name}\n\n{chunk}"

                        vector = self.embedder.embed(chunk)
                        self.storage.save_embedding(
                            chunk, vector, document_id, self.collection_id
                        )
                    self.storage.update_document_status(Status.COMPLETED, document_id)
                    logger.info(f"Document: {file_name} embedded!")

                except Exception as e:
                    self.storage.update_document_status(Status.FAILED, document_id)
                    logger.error(
                        f"Error processing {file_name}, ID: {document_id}. Error: {e}"
                    )
            self.storage.update_collection_status(Status.COMPLETED, self.collection_id)

        except Exception as e:
            self.storage.update_collection_status(Status.FAILED, self.collection_id)
            logger.error(f"Error processing collection_id_{self.collection_id}: {e}")

    def _get_text_content(self, binary_content) -> str:

        content = bytes(binary_content).decode("utf-8")
        return content

    def _get_chunk_strategy(self, chunk_strategy, chunk_size, chunk_overlap):
        strategies = {
            "token": TokenChunker,
            "character": CharacterChunker,
            "markdown": MarkdownChunker,
            "html": HTMLChunker,
            "json": JSONChunker,
        }
        return strategies[chunk_strategy](chunk_size, chunk_overlap)

    def _create_default_embedding_function(self):

        return OpenAIEmbedder(
            api_key=os.getenv("OPENAI_API_KEY"), model_name="text-embedding-3-small"
        )

    def _set_embedder_config(self, embedder_config) -> None:
        """Set the embedding configuration for the knowledge storage."""

        try:
            provider = embedder_config["provider"].lower()
            provider_to_class = {
                "openai": OpenAIEmbedder,
                # TODO: Add other providers here when implemented
            }
            embedder_class = provider_to_class.get(provider)
            if embedder_class is None:
                raise ValueError(f"Embedder provider '{provider}' is not supported.")

            return embedder_class(
                api_key=embedder_config["api_key"],
                model_name=embedder_config["model_name"],
            )
        except Exception as e:
            logger.info(
                f"Failed to set custom embedder. Default embedder setted. Error: {e}"
            )
            return self._create_default_embedding_function()
