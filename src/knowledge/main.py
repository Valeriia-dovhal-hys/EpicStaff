import os
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from loguru import logger

from services.redis_service import RedisService
from collection_processor import CollectionProcessor
from models.request_models import KnowledgeSearchMessage

# Redis Configuration
redis_host = os.getenv("REDIS_HOST", "127.0.0.1")
redis_port = int(os.getenv("REDIS_PORT", "6379"))

knowledge_sources_channel = os.getenv("KNOWLEDGE_SOURCES_CHANNEL", "knowledge_sources")
knowledge_search_get_channel = os.getenv("KNOWLEDGE_SEARCH_GET_CHANNEL", "knowledge:search:get")
knowledge_search_response_channel = os.getenv("KNOWLEDGE_SEARCH_RESPONSE_CHANNEL", "knowledge:search:response")


async def indexing(redis_service, executor):
    """Handles embedding creation from the Redis queue asynchronously."""
    logger.info(f"Subscribed to channel '{knowledge_sources_channel}' for embeddings.")

    pubsub = await redis_service.async_subscribe(knowledge_sources_channel)
    async for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data = json.loads(message["data"])
                collection_id = data["collection_id"]
                
                logger.info(f"Processing embeddings for collection_id: {collection_id}")

                # Run blocking function in a ProcessPoolExecutor for CPU-bound work
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(executor, run_process_collection, collection_id)

                logger.info(f"Embeddings created for collection_id: {collection_id}")
            except Exception as e:
                logger.error(f"Error processing embedding: {e}")


def run_process_collection(collection_id):
    """Runs the blocking embedding process in a separate process."""
    processor = CollectionProcessor(collection_id)
    processor.process_collection()


async def searching(redis_service):
    """Handles search queries from the Redis queue asynchronously."""
    logger.info(f"Subscribed to channel '{knowledge_search_get_channel}' for search queries.")

    pubsub = await redis_service.async_subscribe(knowledge_search_get_channel)
    async for message in pubsub.listen():
        if message["type"] == "message":
            try:
                parsed_data = json.loads(message["data"])
                data = KnowledgeSearchMessage(**parsed_data)
                collection_id = data.collection_id

                logger.info(f"Processing search for collection_id: {collection_id}")
                
                processor = CollectionProcessor(collection_id)
                result = processor.search(
                    uuid=data.uuid,
                    query=data.query,
                    search_limit=data.search_limit,
                    distance_threshold=data.distance_threshold
                )

                await redis_service.async_publish(knowledge_search_response_channel, result)
                
                logger.info(f"Search completed for collection_id: {collection_id}")
            except Exception as e:
                logger.error(f"Error processing search: {e}")


async def main():
    """Runs both tasks concurrently"""
    redis_service = RedisService(host=redis_host, port=redis_port)
    await redis_service.connect()

    # Use a ProcessPoolExecutor for CPU-bound tasks
    executor = ThreadPoolExecutor()

    task1 = asyncio.create_task(indexing(redis_service, executor))
    task2 = asyncio.create_task(searching(redis_service))

    try:
        await asyncio.gather(task1, task2, return_exceptions=True)
    finally:
        executor.shutdown(wait=True) 


if __name__ == "__main__":
    asyncio.run(main())