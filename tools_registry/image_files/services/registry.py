class __SingletonMeta(type):

    _instances = {}

    def __call__(cls, *args, **kwargs):

        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]


class Registry(metaclass=__SingletonMeta):

    def __init__(self):
        self.__alias_port = dict()

    # def get_available_port(self): ...

    def register(self, alias, port):
        self.__alias_port[alias] = port

    def get_port_by_alias(self, alias):
        return self.__alias_port[alias]

    def set_alias_port(self, alias, port):
        self.__alias_port[alias] = port
