import pytest
from models.dotdict import DotDict
from models.state import State
from utils import set_output_variables

@pytest.fixture
def sample_state():
    return State(
        {
            "variables": DotDict(
                {
                    "value1": 5,
                    "nested": {"key": "old_value", "list": [1, {"deep": "keep"}, 3]},
                }
            )
        }
    )


def test_set_output_variables_basic_update(sample_state):
    set_output_variables(sample_state, "variables.value1", 10)
    assert sample_state["variables"].value1 == 10

def test_set_output_variables_basic_set_number(sample_state):
    set_output_variables(sample_state, "variables.nested", 10)
    assert sample_state["variables"].nested == 10

def test_set_output_variables_basic_set_list(sample_state):
    set_output_variables(sample_state, "variables.nested", [10, {"a": 20}])
    assert sample_state["variables"].nested[0] == 10
    assert sample_state["variables"].nested[1].a == 20

def test_set_output_variables_nested_update(sample_state):
    set_output_variables(sample_state, "variables.nested.key", "new_value")
    assert sample_state["variables"].nested.key == "new_value"


def test_set_output_variables_list_index_update(sample_state):
    set_output_variables(sample_state, "variables.nested.list[0]", 42)
    assert sample_state["variables"].nested.list[0] == 42


def test_set_output_variables_nested_list_dict_update(sample_state):
    set_output_variables(sample_state, "variables.nested.list[1].deep", "changed")
    assert sample_state["variables"].nested.list[1].deep == "changed"


def test_set_output_variables_invalid_path(sample_state):
    invalid_path = "invalid.path"
    with pytest.raises(ValueError, match=f"`{invalid_path}` does not contain name `variables`"):
        set_output_variables(state=sample_state, output_variable_path=invalid_path, output=100)


def test_set_output_variables_whole_update(sample_state):
    set_output_variables(state=sample_state, output_variable_path="variables", output={"new_key": "new_value"})
    assert sample_state["variables"].new_key == "new_value"

def test_set_output_variables_whole_update_invalid_output_type(sample_state):
    output = 3
    with pytest.raises(ValueError, match=f"Output `{output}` should be a dict to update the whole variables"):
        set_output_variables(state=sample_state, output_variable_path="variables", output=output)