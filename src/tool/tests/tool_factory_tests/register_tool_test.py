import pytest
from tests.tool_factory_tests.fixtures import dynamic_tool_factory
from unittest.mock import MagicMock
from tool_factory import DynamicToolFactory


def test_register_tool_class(dynamic_tool_factory: DynamicToolFactory):

    mock_tool_alias = "mock tool"
    mock_test_tool_class = MagicMock()
    mock_default_args = MagicMock()
    mock_default_kwargs = MagicMock()

    dynamic_tool_factory.register_tool_class(
        mock_tool_alias, mock_test_tool_class, mock_default_args, mock_default_kwargs
    )

    assert (
        mock_tool_alias in dynamic_tool_factory._tool_registry
    ), f"{mock_test_tool_class} not in registry"

    registry_item = dynamic_tool_factory._tool_registry[mock_tool_alias]

    assert registry_item.tool_class == mock_test_tool_class
    assert registry_item.args == mock_default_args
    assert registry_item.kwargs == mock_default_kwargs


def test_register_tool_class_without_arguments(
    dynamic_tool_factory: DynamicToolFactory,
):

    mock_tool_alias = "mock tool"
    mock_test_tool_class = MagicMock()

    dynamic_tool_factory.register_tool_class(mock_tool_alias, mock_test_tool_class)

    assert (
        mock_tool_alias in dynamic_tool_factory._tool_registry
    ), f"{mock_test_tool_class} not in registry"

    registry_item = dynamic_tool_factory._tool_registry[mock_tool_alias]

    assert registry_item.tool_class == mock_test_tool_class
    assert registry_item.args == tuple()  # assert empty tuple
    assert registry_item.kwargs == dict()  # assert empty dict



