import pytest
import json


@pytest.fixture
def tools_config_file(tmpdir):

    tools_config_content = [
        {
            "image_name": "wolfram_alpha",
            "tool_dict": {
                "wolfram_alpha": {
                    "class_name": "WolframAlphaQueryRun",
                    "kwargs": {
                        "api_wrapper": {
                            "package": "langchain_community",
                            "callable_name": "WolframAlphaAPIWrapper",
                            "kwargs": {
                                "wolfram_alpha_appid": "123"
                            }
                        }
                    }
                }
            },
            "dependencies": [
                "wolframalpha", "langchain", "langchain_community"
            ]
        }
    ]

    tools_config_path = tmpdir.join("tools_config.json")

    with open(tools_config_path, 'w') as f:
        json.dump(tools_config_content, f)

    return tools_config_path


@pytest.fixture
def tools_paths_file(tmpdir):
    tools_paths_content = {
        "WolframAlphaQueryRun": "langchain_community.tools.wolfram_alpha.tool",
        "WolframAlphaAPIWrapper": "langchain_community.utilities.wolfram_alpha"
    }

    tools_paths_path = tmpdir.join("tools_paths.json")

    with open(tools_paths_path, 'w') as f:
        json.dump(tools_paths_content, f)

    return tools_paths_path