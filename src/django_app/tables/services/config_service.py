from pathlib import Path

import yaml


class YamlConfigService:

    _CONFIG_PATH = Path("/home/user/root/django/env_config/config.yaml").resolve()

    def get(self, key: str) -> str:
        config_dict = self.read_yaml_config(self._CONFIG_PATH)
        return config_dict.get(key, None)

    def get_all(self) -> dict[str, str]:
        return self.read_yaml_config(self._CONFIG_PATH)

    def set(self, key: str, value: str) -> None:
        self.update_yaml_config(self._CONFIG_PATH, {key: value})

    def set_all(self, config_dict: dict[str, str]) -> None:
        self.update_yaml_config(self._CONFIG_PATH, config_dict)

    def delete(self, key: str) -> None:
        config_dict = self.get_all()
        config_dict.pop(key)
        self.rewrite_yaml_config(self._CONFIG_PATH, config_dict)

    @classmethod
    def read_yaml_config(cls, yaml_config_path: Path):
        yaml_config_path.touch(exist_ok=True)

        with open(yaml_config_path) as f:
            cfg: dict = yaml.load(f, Loader=yaml.FullLoader) or {}
        return cfg

    @classmethod
    def rewrite_yaml_config(
        cls, yaml_config_path: Path, new_config_dict: dict[str, str]
    ):
        with open(yaml_config_path, "w") as f:
            yaml.dump(new_config_dict, f)
        return new_config_dict

    @classmethod
    def update_yaml_config(
        cls, yaml_config_path: Path, new_config_dict: dict[str, str]
    ):
        config_dict = cls.read_yaml_config(yaml_config_path=yaml_config_path)

        config_dict.update(new_config_dict)

        with open(yaml_config_path, "w") as f:
            yaml.dump(config_dict, f)
        return config_dict
