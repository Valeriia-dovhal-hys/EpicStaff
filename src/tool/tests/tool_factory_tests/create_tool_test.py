import pytest
from tests.tool_factory_tests.fixtures import dynamic_tool_factory
from unittest.mock import MagicMock
from tool_factory import DynamicToolFactory


def test_create_tool(dynamic_tool_factory: DynamicToolFactory):

    mock_tool_alias = "mock tool"
    mock_test_tool_class = MagicMock()
    default_args = (1, [2, 3], "f")
    default_kwargs = {
        "test_key": "test_value",
        "test_key2": "test_value2",
    }

    create_args = (
        6,
        ("I'll be", "back"),
        "TEST!!!",
    )
    create_kwargs = {
        "very interesting key": "boring value",
        "test_key2": None,
    }

    dynamic_tool_factory.register_tool_class(
        mock_tool_alias, mock_test_tool_class, default_args, default_kwargs
    )
    created_tool = dynamic_tool_factory.create(
        mock_tool_alias, create_args, create_kwargs
    )

    mock_test_tool_class.assert_called_once_with(
        *(default_args + create_args), **{**default_kwargs, **create_kwargs}
    )

def test_create_tool_without_default_arguments(dynamic_tool_factory: DynamicToolFactory):

    mock_tool_alias = "mock tool"
    mock_test_tool_class = MagicMock()


    create_args = (
        7,
        ("I won't be", "back"),
        "!!!TEST",
    )
    create_kwargs = {
        "boring key": "very interesting value",
        "test_key2": None,
    }

    dynamic_tool_factory.register_tool_class(
        mock_tool_alias, mock_test_tool_class, 
    )
    created_tool = dynamic_tool_factory.create(
        mock_tool_alias, create_args, create_kwargs
    )

    mock_test_tool_class.assert_called_once_with(
        *create_args, **create_kwargs
    )