import importlib
import typing
from base_models import Callable

def import_callable(module_path: str, class_name: str) -> typing.Callable:
    module = importlib.import_module(module_path)
    return getattr(module, class_name)


def parse_callable(callable: Callable, eval=False):
    class_ = import_callable(module_path=callable.module_path, class_name=callable.class_name)
    if callable.args is None:
        callable.args = list()
    if callable.kwargs is None:
        callable.kwargs = dict()


    args = parse_entity(callable.args)
    kwargs = parse_entity(callable.kwargs)
    
    if not eval:
        return class_, args, kwargs

    return class_(*args, **kwargs)


def parse_entity(entity: str | Callable | typing.Sequence | typing.Dict):
    if isinstance(entity, str):
        return entity
    if isinstance(entity, Callable):
        return parse_callable(entity, eval=True)
    if isinstance(entity, typing.Sequence):
        return parse_sequence(entity)
    if isinstance(entity, typing.Dict):
        return parse_dict(entity)

def parse_sequence(sequence: typing.Sequence) -> list:
    parsed_sequence = []
    for item in sequence:
        parsed_sequence.append(parse_entity(item))
    return parsed_sequence
        


def parse_dict(dict_: typing.Dict[str, typing.Any]):
    parsed_dict = dict()
    for k, v in dict_:
        parsed_dict[k] = parse_entity(v)
    return parsed_dict