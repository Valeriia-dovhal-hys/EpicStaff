import asyncio
import os
from services.graph.graph_session_manager_service import GraphSessionManagerService
from services.python_code_executor_service import RunPythonCodeService
from services.crew.crew_parser_service import CrewParserService
from services.knowledge_search_service import KnowledgeSearchService
from services.redis_service import RedisService
from utils.logger import logger


async def main():
    # Load configuration from environment variables
    manager_host = os.environ.get("MANAGER_HOST", "127.0.0.1")
    manager_port = int(os.environ.get("MANAGER_PORT", "8001"))
    redis_host = os.environ.get("REDIS_HOST", "127.0.0.1")
    redis_port = int(os.environ.get("REDIS_PORT", 6379))
    session_schema_channel = os.environ.get("SESSION_SCHEMA_CHANNEL", "sessions:schema")
    crewai_output_channel = os.environ.get(
        "CREWAI_OUTPUT_CHANNEL", "sessions:crewai_output"
    )

    # Initialize services
    redis_service = RedisService(host=redis_host, port=redis_port)
    python_code_executor_service = RunPythonCodeService(redis_service=redis_service)
    knowledge_search_service = KnowledgeSearchService(redis_service=redis_service)

    crew_parser_service = CrewParserService(
        manager_host=manager_host,
        manager_port=manager_port,
        redis_service=redis_service,
        python_code_executor_service=python_code_executor_service,
        knowledge_search_service=knowledge_search_service,
    )
    session_manager_service = GraphSessionManagerService(
        redis_service=redis_service,
        crew_parser_service=crew_parser_service,
        session_schema_channel=session_schema_channel,
        python_code_executor_service=python_code_executor_service,
        crewai_output_channel=crewai_output_channel,
        knowledge_search_service=knowledge_search_service,
    )

    try:
        # Initialize Redis and start listening
        logger.info("Initializing Redis connection...")
        await redis_service.connect()
        logger.info("Redis connection established.")

        session_manager_service.start()
        # Run indefinitely
        while True:
            await asyncio.sleep(0.1)

    except Exception as e:
        logger.error(f"An error occurred: {e}", exc_info=True)
    finally:
        logger.info("Shutting down...")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down due to keyboard interrupt.")
