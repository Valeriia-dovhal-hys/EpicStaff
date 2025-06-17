from dataclasses import dataclass
import ast
from typing import Any

from collections.abc import Mapping


@dataclass
class Expression:
    code: str
    func: Any

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)


class DotDict(Mapping):
    __slots__ = ("__dict__", "_properties", "_setters")
    MAX_DEPTH = 50

    RESERVED_KEYS = {
        "__dict__",
        "__class__",
        "__module__",
        "__weakref__",
        "__properties__",
    }
    BUILTIN_METHODS = {"get", "keys", "values", "items", "update", "copy"}

    def __init__(self, dictionary, depth=0):

        self._properties = {}
        self._setters = {}

        properties = dictionary.pop("__properties__", None)
        setters = dictionary.pop("__setters__", None)

        self.__dict__.update(
            {
                self._safe_key(k): self._convert(v, depth + 1)
                for k, v in dictionary.items()
            }
        )

        if properties is not None:
            if not isinstance(properties, dict):
                raise TypeError("__properties__ should be dictionary.")
            for k, v in properties.items():
                self.add_property(k, v)

        if setters is not None:
            if not isinstance(setters, dict):
                raise TypeError("__setters__ should be dictionary.")
            for k, v in setters.items():
                self.add_setter(k, v)

    def _convert(self, value, depth):
        if isinstance(value, dict):
            return DotDict(value, depth)
        elif isinstance(value, list):
            return [self._convert(item, depth) for item in value]
        return value

    def _safe_key(self, key):
        if key in self.RESERVED_KEYS or key in self.BUILTIN_METHODS:
            return f"_{key}"
        return key

    def __getitem__(self, key):
        return self.__dict__[key]

    def __iter__(self):
        return iter(self.__dict__)

    def __len__(self):
        return len(self.__dict__)

    def __getattr__(self, key):
        try:
            return self.__dict__[key]
        except KeyError:
            if key in self._properties:
                return self._properties[key]()

            # self.__dict__[key] = DotDict(dictionary={})
            # return self.__dict__[key]
            raise AttributeError(
                f"'{self.__class__.__name__}' object has no attribute '{key}'"
            )

    def __setattr__(self, key, value):
        if key in {"_properties", "_setters"} or key in self.__slots__:
            super().__setattr__(key, value)
        else:
            key = self._safe_key(key)

            if key in self._setters:
                setter_func = self._setters[key]
                value = setter_func(value)

            self.__dict__[key] = self._convert(value, 0)
            self._update_properties()

    def _update_properties(self):
        for key, func in self._properties.items():
            self.__dict__[key] = func()

    def add_property(self, name, code: str):
        try:
            tree = ast.parse(code, mode="eval")
            compiled_expr = compile(tree, "<string>", "eval")

            func = lambda: eval(compiled_expr, {}, self.__dict__)
            expr = Expression(code=code, func=func)
            self._properties[name] = expr
            self.__dict__[name] = self._properties[name]()
        except Exception as e:
            raise ValueError(f"Invalid expression for property '{name}': {e}")

    def add_setter(self, name, code: str):
        try:
            tree = ast.parse(code, mode="eval")
            compiled_expr = compile(tree, "<string>", "eval")

            func = lambda value: eval(
                compiled_expr, {}, {**self.__dict__, "value": value}
            )
            expr = Expression(code=code, func=func)
            self._setters[name] = expr

        except Exception as e:
            raise ValueError(f"Invalid expression for setter '{name}': {e}")

    def __repr__(self):
        return f"DotDict({self.__dict__})"

    def __copy__(self):
        return DotDict(self.__dict__.copy())

    def update(self, new_data: dict):
        """update DotDict overwriting fields with new data"""
        if not isinstance(new_data, dict):
            raise TypeError("update method requires a dictionary.")
        properties = new_data.pop("__properties__", None)
        setters = new_data.pop("__setters__", None)
        self.__dict__.update(
            {self._safe_key(k): self._convert(v, 0) for k, v in new_data.items()}
        )

        if properties is not None:
            if not isinstance(properties, dict):
                raise TypeError("__properties__ should be dictionary.")
            for k, v in properties.items():
                self.add_property(k, v)

        if setters is not None:
            if not isinstance(setters, dict):
                raise TypeError("__setters__ should be dictionary.")
            for k, v in setters.items():
                self.add_setter(k, v)
        return self

    def model_dump(self) -> dict:
        """DotDict to dict"""
        result = {}
        for key, value in self.__dict__.items():
            if isinstance(value, DotDict):
                result[key] = value.model_dump()
            elif isinstance(value, list):
                result[key] = [
                    v.model_dump() if isinstance(v, DotDict) else v for v in value
                ]
            else:
                result[key] = value

        __properties__ = {k: v.code for k, v in self._properties.items()}
        if __properties__:
            result["__properties__"] = __properties__
        __setters__ = {k: v.code for k, v in self._setters.items()}
        if __setters__:
            result["__setters__"] = __setters__

        return result
