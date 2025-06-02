import pytest
import json
from pytest_mock import MockFixture
from pytest_mock import mocker
from unittest.mock import MagicMock, mock_open
from repositories.import_tool_data_repository import ImportToolDataRepository
from base_models import Callable, ImportToolData
from fixtures import tools_config_file, tools_paths_file


class TestToolContainerHandling:

    def test_get_import_class_data(self, tools_config_file, tools_paths_file):
        
        repository = ImportToolDataRepository(
            tools_config_path=tools_config_file,
            tools_paths_path=tools_paths_file
        )

        image_name = 'wolfram_alpha'
        result = repository.get_import_class_data(image_name)

        expected_tool_dict = {
            'wolfram_alpha': Callable(
                module_path='langchain_community.tools.wolfram_alpha.tool',
                class_name='WolframAlphaQueryRun',
                package=None,
                args=None,
                kwargs={
                    'api_wrapper': Callable(
                        module_path='langchain_community.utilities.wolfram_alpha',
                        class_name='WolframAlphaAPIWrapper',
                        package='langchain_community',
                        args=None,
                        kwargs={
                            'wolfram_alpha_appid': '123'
                        }
                    )
                }
            )
        }

        expected_dependencies = ["wolframalpha", "langchain", "langchain_community"]

        expected_result = ImportToolData(
            image_name='wolfram_alpha',
            tool_dict=expected_tool_dict,
            dependencies=expected_dependencies,
            force_build=False
        )

        assert result == expected_result