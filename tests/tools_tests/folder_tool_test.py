from datetime import time
from pathlib import Path
from typing import Set

import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch, create_autospec
from os import walk
from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import folder_tool, test_dir


def create_test_files(dirs_paths: Set[Path], file_paths: Set[Path]) -> None:

    for dp in dirs_paths:
        dp.mkdir(exist_ok=True, parents=True)

    for fp in file_paths:
        fp.touch(exist_ok=True)

def read_test_filepaths(test_file_name):
    with open(test_file_name, 'r') as f:
        lines = f.read().splitlines()

    return {Path(line) for line in lines}

class TestFileCreateTool:
    dirs = ['wise', 'men', 'say', 'help/falling/in/love']
    recursive_files = ['wise/only.bat', 'men/fools.txt', 'say/rush.dll',
             'help/falling/in/love/with.cpp',
             'help/falling/in/love/you.md']
    non_recursive_files = [
             'in.exe', 'but.ini', 'cant.py',
    ]

    def test_folder_tool_recursive_true(self, mocker, folder_tool):
        dirs_paths = {Path(test_dir) / d for d in self.dirs}
        file_paths = {Path(test_dir) / f for f in self.recursive_files + self.non_recursive_files}

        create_test_files(dirs_paths, file_paths)

        tool = folder_tool

        mocked_datetime = mocker.patch('time.strftime', return_value='TEST')

        result = tool._run(folder_path=test_dir, save_directory=test_dir, recursive=True)

        expected = file_paths
        actual = read_test_filepaths(test_dir + "find_TEST.txt")

        assert actual == expected

        assert result.startswith(f"{len(expected)} files were listed. Here are the first 5 lines:\n")

    def test_folder_tool_recursive_false(self, mocker, folder_tool):
        dirs_paths = {Path(test_dir) / d for d in self.dirs}
        file_paths = {Path(test_dir) / f for f in self.non_recursive_files + self.recursive_files}

        create_test_files(dirs_paths, file_paths)

        tool = folder_tool

        mocker.patch('time.strftime', return_value='TEST2')

        result: str = tool._run(folder_path=test_dir, save_directory=test_dir, recursive=False)

        expected = {Path(test_dir) / f for f in self.non_recursive_files}
        actual = read_test_filepaths(test_dir+"find_TEST2.txt")
        assert actual == expected

        assert result.startswith(f"{len(expected)} files were listed. Here are the files:\n")
