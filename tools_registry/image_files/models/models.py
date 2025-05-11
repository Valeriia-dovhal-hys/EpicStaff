from pydantic import BaseModel

class RunToolModel(BaseModel):
    run_params_txt: str
