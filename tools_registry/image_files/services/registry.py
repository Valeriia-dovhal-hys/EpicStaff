class __SingletonMeta(type):

    _instances = {}

    def __call__(cls, *args, **kwargs):

        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]


class Registry(metaclass=__SingletonMeta):

    def __init__(self):
        self.__tool_alias_container = dict()

    # def get_available_port(self): ...

    def register(self, tool_alias, container_name,):
        self.__tool_alias_container[tool_alias] = container_name

    def get_container_name_by_tool_alias(self, tool_alias):
        return self.__tool_alias_container[tool_alias]

    def set_alias_port(self, alias, port):
        self.__alias_port[alias] = port
