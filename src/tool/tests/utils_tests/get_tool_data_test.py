import json
from tests.fixtures import (
    test_tool_class_with_args_schema,
    test_tool_class_without_args_schema,
)
from utils import get_tool_data
from langchain_core.tools import BaseTool


def test_get_tool_data_with_args_schema(test_tool_class_with_args_schema: BaseTool):
    test_tool_class = test_tool_class_with_args_schema
    tool_data = get_tool_data(test_tool_class())

    
    assert tool_data["name"] == "Test tool"
    assert tool_data["description"] == "It is a test tool to check if system works correctly"

    dict_args_schema = tool_data["args_schema"]

    expected_schema = {
        "description": "Input for the Test tool.",
        "properties": {
            "string_test_field": {"title": "String Test Field", "type": "string", "description": "some string to test"},
            "integer_test_field": {"title": "Integer Test Field", "type": "integer", "description": "some integer to test"},
        },
        "required": ["string_test_field", "integer_test_field"],
        "title": "TestToolInput",
        "type": "object",
    }

    assert dict_args_schema == expected_schema


def test_get_tool_data_without_args_schema(test_tool_class_without_args_schema):
    test_tool_class = test_tool_class_without_args_schema
    tool_data = get_tool_data(test_tool_class())
    

    assert tool_data["name"] == "Test tool"
    assert tool_data["description"] == "It is a test tool to check if system works correctly"

    dict_args_schema = tool_data["args_schema"]

    expected_schema = {
        "description": "Concatinate string and int fields",
        "properties": {
            "string_test_field": {"title": "String Test Field", "type": "string"},
            "integer_test_field": {"title": "Integer Test Field", "type": "integer"},
        },
        "required": ["string_test_field", "integer_test_field"],
        "title": "TestToolInput",
        "type": "object",
    }

    assert dict_args_schema == expected_schema
