import os
from pathlib import Path

import yaml


class YamlConfigService:

    _CONFIG_PATH = Path("/home/user/root/django/env_config").resolve().as_posix()

    def get(self, key: str) -> str:
        config_dict = self.read_yaml_config(self._CONFIG_PATH)
        return config_dict.get(key, None)

    def getAll(self) -> dict[str, str]:
        return self.read_yaml_config(self._CONFIG_PATH)

    def set(self, key: str, value: str) -> None:
        self.set_yaml_config(self._CONFIG_PATH, {key: value})

    def set_all(self, config_dict: dict[str, str]) -> None:
        self.set_yaml_config(self._CONFIG_PATH, config_dict)

    @classmethod
    def read_yaml_config(cls, yaml_config_path: Path):
        with open(Path(yaml_config_path).resolve()) as f:
            cfg: dict = yaml.load(f, Loader=yaml.FullLoader)
        return cfg

    @classmethod
    def set_yaml_config(cls, yaml_config_path: Path, new_config_dict: dict[str, str]):
        config_dict = cls.read_yaml_config(yaml_config_path=yaml_config_path)

        config_dict.update(new_config_dict)

        with open(Path(yaml_config_path).resolve(), "w") as f:
            yaml.dump(config_dict, f)
        return config_dict
