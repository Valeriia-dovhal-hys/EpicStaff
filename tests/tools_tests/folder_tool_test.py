from datetime import time
from pathlib import Path
from typing import Set
from os import walk
from crewai import Task

import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch, create_autospec

from tests.mocks.tools_mocks import mock_empty_file
from tests.tools_tests.fixtures import folder_tool
from tests.conftest import test_dir


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

    def test_folder_tool_recursive_true(self, mocker, monkeypatch, folder_tool):
        dirs_paths = {Path(test_dir) / d for d in self.dirs}
        file_paths = {Path(test_dir) / f for f in self.recursive_files + self.non_recursive_files}

        create_test_files(dirs_paths, file_paths)

        tool = folder_tool

        mocked_datetime = mocker.patch('time.strftime', return_value='TEST1')
        monkeypatch.setenv("SAVE_FILE_PATH", test_dir)

        result = tool._run(folder_path=test_dir, recursive=True)

        expected = file_paths
        actual = read_test_filepaths(test_dir + "folder_tool_outputTEST1.txt")

        assert actual == expected

        assert result.startswith(f"{len(expected)} files were listed. Here are the first 5 lines:\n")

    def test_folder_tool_recursive_false(self, mocker, monkeypatch, folder_tool):
        dirs_paths = {Path(test_dir) / d for d in self.dirs}
        file_paths = {Path(test_dir) / f for f in self.non_recursive_files + self.recursive_files}

        create_test_files(dirs_paths, file_paths)

        tool = folder_tool

        mocker.patch('time.strftime', return_value='TEST2')
        monkeypatch.setenv("SAVE_FILE_PATH", test_dir)

        result: str = tool._run(folder_path=test_dir, recursive=False)

        expected = {Path(test_dir) / f for f in self.non_recursive_files}
        actual = read_test_filepaths(test_dir + "folder_tool_outputTEST2.txt")
        assert actual == expected

        assert result.startswith(f"{len(expected)} files were listed. Here are the files:\n")

    # TODO: Need to make sure folder_tool return posix paths, 
    # as for now there is a bug here with weird paths like tests/tmp/help\falling\in\love\you.md

    # TODO: Need to reduce repetitive code with initializing and populating dirs, investigate the 
    # best approach to remove it to fixtures or something like that
    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_folder_tool_with_crewai(self, mocker, monkeypatch, agent, folder_tool):

        dirs_paths = {Path(test_dir) / d for d in self.dirs}
        file_paths = {Path(test_dir) / f for f in self.recursive_files + self.non_recursive_files}

        create_test_files(dirs_paths, file_paths)

        mocked_datetime = mocker.patch('time.strftime', return_value='CREWAITEST')
        monkeypatch.setenv("SAVE_FILE_PATH", test_dir)
        
        agent.tools.append(folder_tool)
        task = Task(
            description=f"""List all files in the folder {test_dir}, 
            including those that are in subfolders.""",
            agent=agent,
            expected_output=f"""The response in the 
            following format using relative path:
            "The list of files in the given folder: the list of files (each on the new line)." (without "")
            if operation was succesfull, "Error." if not""",
        )

        output = agent.execute_task(task)

        expected = file_paths
        actual = read_test_filepaths(test_dir + "folder_tool_outputCREWAITEST.txt")

        assert output == r"""The list of files in the given folder:
```
tests/tmp/but.ini
tests/tmp/cant.py
tests/tmp/in.exe
tests/tmp/help\falling\in\love\with.cpp
tests/tmp/help\falling\in\love\you.md
[Additional lines from tests\tmp\folder_tool_outputCREWAITEST.txt]
```"""

