import json
from pathlib import Path
from src.fastapi.services.crew_parser import CrewParser


with open(Path("tests/main_crew_parser/test_json.json"), "r") as f:
    test_json = f.read()

crew_data = json.loads(test_json)

parser = CrewParser(tool_registry_host="localhost", tool_registry_port=4800)

crew = parser.parse_crew(crew_data=crew_data)

print(crew.id)
