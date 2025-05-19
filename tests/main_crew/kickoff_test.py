from pathlib import Path
from src.crew.fastapi.models.request_models import CrewData

from src.crew.celery.tasks import kickoff

with open(Path("tests/main_crew/test_json.json"), "r") as f:
    test_json = f.read()

# parser = CrewParser(tool_registry_host="localhost", tool_registry_port=8001)


crew_data = CrewData.model_validate_json(test_json)

# load_env(Path("config/config.yaml").resolve().as_posix())
# crew = parser.parse_crew(crew_data=crew_data)


result = kickoff.delay(test_json)

print(result.get(timeout=200))
