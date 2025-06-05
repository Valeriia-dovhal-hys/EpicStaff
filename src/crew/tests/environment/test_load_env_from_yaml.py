import os
import pytest
from unittest.mock import mock_open, patch

from tests.environment.fixtures import mock_yaml_content

from utils.helpers import load_env_from_yaml_config


def test_load_env_from_yaml():
    """
    Scenario: Verify that `load_env_from_yaml_config` correctly loads environment variables from a YAML file.
    - Mock the `open` function to simulate reading a YAML configuration file with predefined content.
    - Clear the `os.environ` dictionary to ensure a clean environment.
    - Call `load_env_from_yaml_config` with the path to the mocked YAML file.
    - Assert that the specific environment variables are set in `os.environ` with the expected values.
    """

    mocked_open = mock_open(read_data=mock_yaml_content)

    with patch("builtins.open", mocked_open):
        with patch.dict(os.environ, {}, clear=True):
            result = load_env_from_yaml_config("mocked_config.yaml")

            assert os.environ['OPENAI_API_KEY'] == '123'
            assert os.environ['ANOTHER_KEY'] == '234'
            assert os.environ['YET_ANOTHER_KEY'] == '345'
