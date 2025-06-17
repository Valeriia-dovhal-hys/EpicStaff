from dotdict import DotDict


def test_dotdict_initialization():
    data = {"a": 1, "b": {"c": 2}}
    dotdict = DotDict(data)
    assert dotdict.a == 1
    assert dotdict.b.c == 2


def test_dotdict_nested_access():
    data = {"x": {"y": {"z": 10}}}
    dotdict = DotDict(data)
    assert dotdict.x.y.z == 10


def test_dotdict_nested_list_access():
    data = {"x": {"y": [{"z": 10}, {"a": 33}]}}
    dotdict = DotDict(data)
    assert dotdict.x.y[0].z == 10


def test_dotdict_property():
    data = {"a": 2}
    dotdict = DotDict(data)
    dotdict.add_property("double_a", "a * 2")
    assert dotdict.double_a == 4


def test_dotdict_setter():
    data = {"a": 10}
    dotdict = DotDict(data)
    dotdict.add_setter("a", "value * 2")
    dotdict.a = 5
    assert dotdict.a == 10  # Because the setter doubles the value


def test_dotdict_update():
    dotdict = DotDict({"a": 1})
    dotdict.update({"b": 2})
    assert dotdict.b == 2


def test_dotdict_model_dump():
    data = {"a": 1, "b": {"c": 2}}
    dotdict = DotDict(data)
    dumped = dotdict.model_dump()
    assert dumped == {"a": 1, "b": {"c": 2}}


