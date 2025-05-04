import os.path
import json
from pathlib import Path
from dotenv import load_dotenv, set_key

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request


class AuthManager:

    @staticmethod
    def authenticate_google_user():

        # TODO: get rid of this src/ENV/.env, use load_dotenv() instead
        load_dotenv("src/ENV/.env")

        creds = None
        token_json = os.getenv("GOOGLE_TOKEN")

        with open(os.getenv("SETTINGS_CONFIG_PATH"), "r") as config_file:
            scopes = json.load(config_file)["google_api"]["scopes"]

        if token_json:
            creds = Credentials.from_authorized_user_info(json.loads(token_json), scopes)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_config(
                    {
                        "installed": {
                            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                            "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")],
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                        }
                    },
                    scopes=scopes
                )
                creds = flow.run_local_server(port=0)
            
            os.environ["GOOGLE_TOKEN"] = creds.to_json()

            env_path = Path("src/ENV/.env")
            set_key(env_path, "GOOGLE_TOKEN", creds.to_json())
        
        return creds
    
