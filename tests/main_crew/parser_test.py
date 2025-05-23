import json
from pathlib import Path
from src.crew.services.crew_parser import CrewParser
from src.crew.models.request_models import CrewData
from src.crew.utils.helpers import load_env
with open(Path("tests/main_crew_parser/test_json.json"), "r") as f:
    test_json = f.read()

parser = CrewParser(manager_host="localhost", manager_port=8001)


crew_data = CrewData.model_validate_json(test_json)

load_env(Path("config/config.yaml").resolve().as_posix())
crew = parser.parse_crew(crew_data=crew_data)

print(crew.id)
