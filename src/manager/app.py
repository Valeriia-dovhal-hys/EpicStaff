import json
from fastapi import FastAPI, HTTPException
import asyncio
import uvicorn
from models.models import (
    RunToolParamsModel,
    ToolListResponseModel,
    ClassDataResponseModel,
    RunToolResponseModel,
)

from repositories.import_tool_data_repository import ImportToolDataRepository
from services.tool_image_service import ToolImageService
from services.tool_container_service import ToolContainerService
from services.crew_container_service import CrewContainerService
from services.redis_service import RedisService
from helpers.yaml_parser import load_env_from_yaml_config
from helpers.logger import logger


app = FastAPI()

import_tool_data_repository = ImportToolDataRepository()
tool_image_service = ToolImageService(import_tool_data_repository=import_tool_data_repository)
tool_container_service = ToolContainerService(
    tool_image_service=tool_image_service,
    import_tool_data_repository=import_tool_data_repository,
)
crew_container_service = CrewContainerService()
redis_service = RedisService()


@app.get("/tool/list", status_code=200, response_model=ToolListResponseModel)
def get_all_tool_aliases():
    try:
        tool_list = import_tool_data_repository.get_tool_alias_list()
        logger.info("Tool list retrieved successfully.")
        return ToolListResponseModel(tool_list=tool_list)
    except Exception as e:
        logger.error(f"Failed to retrieve tool list: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/tool/{tool_alias}/class-data", status_code=200, response_model=ClassDataResponseModel)
def get_class_data(tool_alias: str):
    try:
        classdata = tool_container_service.request_class_data(tool_alias=tool_alias)["classdata"]
        logger.info(f"Class data retrieved successfully for tool alias: {tool_alias}")
        return ClassDataResponseModel(classdata=classdata)
    except Exception as e:
        logger.error(f"Failed to retrieve class data for tool alias {tool_alias}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/tool/{tool_alias}/run", status_code=200, response_model=RunToolResponseModel)
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


@app.on_event("startup")
async def start_redis_subscription():
    try:
        await redis_service.init_redis()
        asyncio.create_task(redis_service.listen_redis())
        logger.info("Redis subscription initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Redis subscription: {e}")


if __name__ == "__main__":
    load_env_from_yaml_config('./manager_config.yaml')
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
