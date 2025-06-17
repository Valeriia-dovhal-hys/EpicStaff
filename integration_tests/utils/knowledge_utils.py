# Файл: utils/knowledge_utils.py
# Цей файл містить утиліти для роботи з тестами знань

import os
import json
import time
import random
import asyncio
import requests
from pathlib import Path
from contextlib import ExitStack
from models.request_models import KnowledgeSearchMessage
from loguru import logger


DJANGO_URL = "http://127.0.0.1:8000/api"


def validate_response(response):
    """Validate API response."""
    if not response.ok:
        raise Exception(f"API call failed: {response.status_code}, {response.text}")


async def knowledge_search(knowledge_collection_id, query, redis_service) -> list[str]:
    """
    Search for knowledge in a collection using Redis pub/sub.

    Args:
        knowledge_collection_id: ID of the knowledge collection
        query: The search query
        redis_service: Redis service instance

    Returns:
        List of search results
    """
    if query is None:
        return []

    knowledge_search_response_channel = os.environ.get(
        "KNOWLEDGE_SEARCH_RESPONSE_CHANNEL", "knowledge:search:response"
    )
    knowledge_search_get_channel = os.environ.get(
        "KNOWLEDGE_SEARCH_GET_CHANNEL", "knowledge:search:get"
    )

    # Create a unique ID for this search request
    execution_uuid = f"test-knowledge-{random.randint(1,1000)}"

    # Subscribe to the response channel
    pubsub = await redis_service.async_subscribe(
        channel=knowledge_search_response_channel
    )

    try:
        # Create and publish the search request
        execution_message = KnowledgeSearchMessage(
            collection_id=knowledge_collection_id,
            uuid=execution_uuid,
            query=query,
            search_limit=3,
            distance_threshold=1,
        )

        await redis_service.async_publish(
            channel=knowledge_search_get_channel,
            message=execution_message.model_dump(),
        )

        # Wait for and process the response
        timeout = 20  # Set a reasonable timeout (in seconds)
        start_time = asyncio.get_event_loop().time()

        while True:
            # Check for timeout
            if asyncio.get_event_loop().time() - start_time > timeout:
                raise TimeoutError(
                    f"Knowledge search timed out after {timeout} seconds"
                )

            # Get message with timeout
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=0.1
            )

            if not message:
                await asyncio.sleep(0.1)
                continue

            # Process message
            try:
                data = json.loads(message["data"])

                if data.get("uuid") == execution_uuid:
                    return data.get("results", [])
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Error processing message: {e}")

            await asyncio.sleep(0.1)
    finally:
        # Ensure we unsubscribe in all cases
        await pubsub.unsubscribe()


def create_source_collection(embedder_config_id: int) -> int:
    """Create a source collection for testing."""
    url = f"{DJANGO_URL}/source-collections/"

    # Define files and their corresponding chunk metadata
    test_files = [
        {
            "path": Path(__file__).parent.parent
            / "knowledge_test_files"
            / "test_text.txt",
            "chunk_size": "1000",
            "chunk_overlap": "10",
            "chunk_strategy": "token",
        },
        {
            "path": Path(__file__).parent.parent
            / "knowledge_test_files"
            / "test_pdf.pdf",
            "chunk_size": "1100",
            "chunk_overlap": "0",
            "chunk_strategy": "character",
        },
    ]

    data = {
        "embedder": embedder_config_id,
        "collection_name": "PYTEST COLLECTION",
    }

    # Add matching chunk metadata with correct indexing
    for i, file in enumerate(test_files):
        data[f"chunk_sizes[{i}]"] = file["chunk_size"]
        data[f"chunk_overlaps[{i}]"] = file["chunk_overlap"]
        data[f"chunk_strategies[{i}]"] = file["chunk_strategy"]

    # Attach files in order
    with ExitStack() as stack:
        files = [
            (f"files[{i}]", stack.enter_context(open(file["path"], "rb")))
            for i, file in enumerate(test_files)
        ]
        response = requests.post(url, data=data, files=files)

    validate_response(response)
    source_collection_data = response.json()
    return source_collection_data["collection_id"]


def knowledge_clean_up(collection_id: int):
    """Clean up the collection after testing."""
    url = f"{DJANGO_URL}/source-collections/{collection_id}/"
    response = requests.delete(url)

    if response.ok:
        logger.info(f"Collection {collection_id} successfully deleted")
    else:
        logger.warning(
            f"Failed to delete collection {collection_id}: {response.status_code}, {response.text}"
        )


def check_statuses_for_embedding_creation(collection_id: int, max_timeout: int = 20):
    """Wait and check for the completion of embedding creation."""
    logger.info(f"Waiting for collection {collection_id} to be ready...")
    time.sleep(2)

    for i in range(max_timeout):
        time.sleep(1)
        response = requests.get(f"{DJANGO_URL}/collection_status/{collection_id}/")
        validate_response(response)
        collection_status_data = response.json()

        if collection_status_data["collection_status"] == "completed":
            break
    else:
        # This runs if the for loop completes without a break
        logger.warning("Max timeout reached waiting for collection to be ready")

    # Verify collection statuses
    assert (
        collection_status_data["total_documents"]
        == collection_status_data["completed_documents"]
    ), "Not all documents were processed"
    assert (
        collection_status_data["failed_documents"] == 0
    ), "Some documents failed processing"
    assert (
        collection_status_data["processing_documents"] == 0
    ), "Documents are still being processed"


def get_embedder_model(name: str = "text-embedding-3-small") -> int:
    """Get embedder model ID by name."""
    embedder_model_response = requests.get(
        f"{DJANGO_URL}/embedding-models/?name={name}"
    )
    validate_response(embedder_model_response)

    results = embedder_model_response.json()["results"]
    if not results:
        raise ValueError(f"Embedder model '{name}' not found")

    return results[0]["id"]


def get_or_create_embedder_config(embedder_model_id: int) -> int:
    """Get or create embedder configuration."""
    embedder_config_data = {
        "custom_name": "MyTestEmbedderConfig",
        "task_type": "retrieval_document",
        "api_key": os.environ.get("OPENAI_KEY"),
        "is_visible": True,
        "model": embedder_model_id,
    }

    # Try to find existing config
    embedder_config_response = requests.get(
        f"{DJANGO_URL}/embedding-configs?custom_name={embedder_config_data['custom_name']}"
    )
    validate_response(embedder_config_response)

    results = embedder_config_response.json()["results"]
    if results:
        return results[0]["id"]

    # Create new config if not found
    embedder_config_response = requests.post(
        f"{DJANGO_URL}/embedding-configs/", json=embedder_config_data
    )
    validate_response(embedder_config_response)
    embedder_config = embedder_config_response.json()

    return embedder_config["id"]
