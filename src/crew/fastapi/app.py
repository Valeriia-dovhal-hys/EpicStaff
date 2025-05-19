import os
import time

from crewai import Crew
from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
from crew.celery.tasks import kickoff
from .models.request_models import RunCrewModel

from services.crew_parser import CrewParser

app = FastAPI()


@app.post("/crew/run", status_code=200)
def run_crew(run_crew_model: RunCrewModel):
    
    kickoff(run_crew_model.model_dump_json())
    


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, workers=1)
