import os
import pytest
from unittest.mock import mock_open, patch

from tests.environment.fixtures import mock_yaml_content

from utils.helpers import load_env_from_yaml_config


def test_load_env_from_yaml():
    mocked_open = mock_open(read_data=mock_yaml_content)

    with patch("builtins.open", mocked_open):
        with patch.dict(os.environ, {}, clear=True):
            result = load_env_from_yaml_config("mocked_config.yaml")

            assert os.environ['OPENAI_API_KEY'] == '123'
            assert os.environ['ANOTHER_KEY'] == '234'
            assert os.environ['YET_ANOTHER_KEY'] == '345'
