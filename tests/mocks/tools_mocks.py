from unittest.mock import mock_open


def mock_empty_file():
    return mock_open()


def mock_file_with_content(content):
    return mock_open(read_data=content)