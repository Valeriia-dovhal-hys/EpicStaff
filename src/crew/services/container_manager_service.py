import os




class ContainerManagerService:
    
    def set_env(self, key: str, value: str) -> None:
        os.environ[key] = value

    def get_crew_id(self):
        return int(os.environ.get("CREW_ID", 0))

