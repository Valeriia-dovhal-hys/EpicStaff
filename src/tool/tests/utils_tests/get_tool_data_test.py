import json
from tests.fixtures import test_tool_with_args_schema, test_tool_without_args_schema
from utils import get_tool_data
from langchain_core.tools import BaseTool


def test_get_tool_data_with_args_schema(test_tool_with_args_schema: BaseTool):
    test_tool = test_tool_with_args_schema
    tool_data = get_tool_data(test_tool)

    assert tool_data["name"] == test_tool.name
    assert tool_data["description"] == test_tool.description

    json_args_schema = tool_data["args_schema_json_schema"]
    dict_args_schema = json.loads(json_args_schema)

    assert test_tool.args_schema.schema() == dict_args_schema


def test_get_tool_data_without_args_schema(test_tool_without_args_schema):
    test_tool = test_tool_without_args_schema
    tool_data = get_tool_data(test_tool)

    assert tool_data["name"] == test_tool.name
    assert tool_data["description"] == test_tool.description

    json_args_schema = tool_data["args_schema_json_schema"]
    dict_args_schema = json.loads(json_args_schema)

    expected_schema = {
        "description": "Concatinate string and int fields",
        "properties": {
            "string_test_field": {"title": "String Test Field", "type": "string"},
            "integer_test_field": {"title": "Integer Test Field", "type": "integer"},
        },
        "required": ["string_test_field", "integer_test_field"],
        "title": "TestTool",
        "type": "object",
    }

    assert dict_args_schema == expected_schema
