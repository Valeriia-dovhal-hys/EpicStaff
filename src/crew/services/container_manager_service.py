import os




class ContainerManagerService:
    
    def set_env(self, key: str, value: str) -> None:
        os.environ[key] = value

    def get_session_id(self):
        return int(os.environ.get("SESSION_ID", 0))

