from unittest.mock import mock_open


def mock_empty_file():
    return mock_open()
