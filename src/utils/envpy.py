import os
from pathlib import Path
import yaml


# def convert_yaml_config_to_env(
#     yaml_config_path=Path("src/ENV/config.yaml"), env_config_path=Path("src/ENV/.env")
# ):
#     with open(yaml_config_path.resolve()) as f:
#         cfg: dict = yaml.load(f, Loader=yaml.FullLoader)

#     env_content = ""
#     for k, v in cfg.items():
#         env_content += f'{k}="{v}"\n'

#     env_config_path.touch(exist_ok=True)
#     with open(env_config_path.resolve(), "w") as f:
#         f.write(env_content)


def load_env_from_yaml_config(yaml_config_path):
    loaded = False
    try:
        with open(Path(yaml_config_path).resolve()) as f:
            cfg: dict = yaml.load(f, Loader=yaml.FullLoader)
        for k, v in cfg.items():
            os.environ[k] = v
        loaded = True
    except Exception as e:
        print(e)
    
    

    return loaded