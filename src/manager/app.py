# TODO: REMOVE
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

import json
import os
from fastapi import FastAPI, HTTPException
import asyncio

from db.config import AsyncSessionLocal
from sqlalchemy import text
from repositories.session_repository import SessionRepository
import uvicorn
from models.models import (
    RunToolParamsModel,
    ToolInitConfigurationModel,
    ToolListResponseModel,
    ClassDataResponseModel,
    RunToolResponseModel,
)

from repositories.import_tool_data_repository import ImportToolDataRepository
from services.tool_image_service import ToolImageService
from services.tool_container_service import ToolContainerService
from services.redis_service import RedisService
from services.session_timeout_service import SessionTimeoutService
from helpers.yaml_parser import load_env_from_yaml_config
from helpers.logger import logger


app = FastAPI()

import_tool_data_repository = ImportToolDataRepository()
tool_image_service = ToolImageService(
    import_tool_data_repository=import_tool_data_repository
)
tool_container_service = ToolContainerService(
    tool_image_service=tool_image_service,
    import_tool_data_repository=import_tool_data_repository,
)
redis_service = RedisService()

session_repository = SessionRepository(AsyncSessionLocal)

session_timeout_service = SessionTimeoutService(
    redis_service=redis_service,
    session_schema_channel=os.environ.get("SESSION_SCHEMA_CHANNEL", "sessions:schema"),
    session_timeout_channel=os.environ.get(
        "SESSION_TIMEOUT_CHANNEL", "sessions:timeout"
    ),
    session_repository=session_repository,
)


@app.post(
    "/tool/{tool_alias}/class-data",
    status_code=200,
    response_model=ClassDataResponseModel,
)
def post_class_data(
    tool_alias: str, tool_init_configuration: ToolInitConfigurationModel
):
    logger.info(f"{tool_alias}; {tool_init_configuration.tool_init_configuration}")
    try:
        classdata = tool_container_service.request_class_data(
            tool_alias=tool_alias,
            tool_init_configuration=tool_init_configuration.model_dump(),
        )["classdata"]
        logger.info(f"Class data retrieved successfully for tool alias: {tool_alias}")
        return ClassDataResponseModel(classdata=classdata)
    except Exception as e:
        logger.error(f"Failed to retrieve class data for tool alias {tool_alias}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post(
    "/tool/{tool_alias}/run", status_code=200, response_model=RunToolResponseModel
)
def run(tool_alias: str, run_tool_params_model: RunToolParamsModel):
    try:
        run_tool_response = tool_container_service.request_run_tool(
            tool_alias=tool_alias, run_tool_params_model=run_tool_params_model
        )
        logger.info(f"Tool with alias {tool_alias} run successfully.")
        return RunToolResponseModel(data=run_tool_response["data"])
    except Exception as e:
        logger.error(f"Failed to run tool with alias {tool_alias}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def test_database_connection():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))

            result = await session.execute(
                text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tables_session')"
                )
            )
            table_exists = result.scalar()

            if not table_exists:
                logger.warning(
                    "tables_session table does not exist - check your database schema"
                )

            await session.commit()

        logger.info("Successfully connected to PostgreSQL database")
        return True

    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


@app.on_event("startup")
async def start_up():
    """
    Starts redis subscribtion, starts SessionTimeoutService, connects to DB
    """
    db_connected = await test_database_connection()
    if not db_connected:
        logger.error("Failed to connect to database during startup")

    try:
        await redis_service.init_redis()
        logger.info("Redis subscription initialized successfully.")

        await session_timeout_service.start()
        logger.info("SessionTimeoutService started successfully.")

        await session_timeout_service.initial_check_all_sessions_for_timeout()
        logger.info("Start SessionTimeoutService initial timeout check.")

        # TODO: ? remove listen_redis() because it newer use
        # asyncio.create_task(redis_service.listen_redis())

    except Exception as e:
        logger.error(f"Error during initialization: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    if session_timeout_service:
        await session_timeout_service.stop()
    await redis_service.aioredis_client.close()


if __name__ == "__main__":
    load_env_from_yaml_config("./manager_config.yaml")
    # port = 8001 for local launch
    port = int(os.environ.get("MANAGER_PORT", "8001"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True, workers=1)
