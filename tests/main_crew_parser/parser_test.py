import json
from src.fastapi.services.crew_parser import CrewParser


test_json = """
{
  "id": 1,
  "agents": [
    {
      "id": 1,
      "tools": [
        {
          "id": 1,
          "llm_model": {
            "id": 1,
            "llm_provider": {
              "id": 1,
              "name": "openai"
            },
            "name": "wikipedia",
            "comments": "string",
            "context_size": 5,
            "base_url": "https://localhost:80",
            "deployment": "string"
          },
          "llm_config": {
            "id": 1,
            "temperature": 0.3,
            "num_ctx": 4
          },
          "embedding_model": {
            "id": 1,
            "embedding_provider": {
              "id": 1,
              "name": "openai"
            },
            "name": "string",
            "deployment": "string",
            "base_url": "http://localhost:80"
          },
          "name": "string",
          "description": "string",
          "requires_model": true,
          "enabled": true
        }
      ],
      "llm_model": {
        "id": 1,
        "llm_provider": {
          "id": 1,
          "name": "openai"
        },
        "name": "wikipedia",
        "comments": "string",
        "context_size": 5,
        "base_url": "https://localhost:80",
        "deployment": "string"
      },
      "llm_config": {
        "id": 1,
        "temperature": 0.3,
        "num_ctx": 4
      },
      "fcm_llm_model": {
        "id": 1,
        "llm_provider": {
          "id": 1,
          "name": "openai"
        },
        "name": "LLM_strifasasfng",
        "comments": "string",
        "context_size": 5,
        "base_url": "https://localhost:80",
        "deployment": "string"
      },
      "fcm_llm_config": {
        "id": 1,
        "temperature": 0.3,
        "num_ctx": 4
      },
      "role": "string",
      "goal": "string",
      "backstory": "string",
      "allow_delegation": true,
      "memory": "string",
      "max_iter": 12
    }
  ],
  "embedding_model": {
    "id": 1,
    "embedding_provider": {
      "id": 1,
      "name": "openai"
    },
    "name": "string",
    "deployment": "string",
    "base_url": "http://localhost:80"
  },
  "manager_llm_model": {
    "id": 1,
    "llm_provider": {
      "id": 1,
      "name": "openai"
    },
    "name": "wikipedia",
    "comments": "string",
    "context_size": 5,
    "base_url": "https://localhost:80",
    "deployment": "string"
  },
  "manager_llm_config": {
    "id": 1,
    "temperature": 0.3,
    "num_ctx": 4
  },
  "comments": "string",
  "name": "string",
  "assignment": "string",
  "process": "sequential",
  "verbose": true,
  "memory": true
}"""


crew_data = json.loads(test_json)

parser = CrewParser(tool_registry_host="localhost", tool_registry_port=4800)

crew = parser.parse_crew(crew_data=crew_data)

print(crew.id)
