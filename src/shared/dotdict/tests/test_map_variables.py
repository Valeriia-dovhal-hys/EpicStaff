import pytest
from dotdict import DotDict
from utils import map_variables_to_input


def test_map_variables_to_input():
    variables = DotDict(
        {
            "value1": 5,
            "foo": {
                "bar": {
                    "test": [
                        1,
                        2,
                        {
                            "a": [
                                {
                                    "b": 3,
                                },
                            ]
                        },
                    ]
                }
            },
        }
    )
    mapping = {
        "key1": "variables.value1",
        "key2": "variables.foo.bar",
        "key3": "variables.foo.bar.test[2].a[0].b",
    }
    output = map_variables_to_input(variables, mapping)
    assert output == {
        "key1": 5,
        "key2": {
            "test": [
                1,
                2,
                {
                    "a": [
                        {
                            "b": 3,
                        },
                    ]
                },
            ]
        },
        "key3": 3,
    }


def test_map_variables_to_input_invalid_key():
    variables = DotDict({"value1": 5})
    mapping = {"key1": "invalid.value"}
    with pytest.raises(ValueError):
        map_variables_to_input(variables, mapping)