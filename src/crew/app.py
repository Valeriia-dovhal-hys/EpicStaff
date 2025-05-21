import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
import requests

from models.request_models import RunCrewModel


app = FastAPI()


@app.post("/crew/run", status_code=200)
def run_crew(run_crew_model: RunCrewModel):
    return 

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7000, reload=True, workers=1)
