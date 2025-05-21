import os
import time

from crewai import Crew
from dotenv import load_dotenv
from fastapi import FastAPI, Response, status
import uvicorn
from fastapi_app.models.request_models import RunCrewModel
from fastapi_app.services.process_service import ProcessService
import multiprocessing as mp

process_service = ProcessService()
app = FastAPI()


@app.post("/crew/run", status_code=200)
def run_crew(run_crew_model: RunCrewModel):

    
    process_service.run_process(run_crew_model.data.model_dump_json())
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get("/result/crew/{crew_id}", status_code=200)
def get_result(crew_id: int):

    
    result = process_service.get_result_by_id(crew_id=crew_id)
    
    return Response(content=result, status_code=status.HTTP_200_OK)



if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
