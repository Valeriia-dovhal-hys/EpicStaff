import os.path
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request


class AuthManager:

    @staticmethod
    def authenticate_google_user(scopes):
        creds = None

        oauth_creds_path = Path("credentials/google_creds/oauth2_credentials.json")
        token_path = Path("credentials/google_creds/token.json")

        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, scopes)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(oauth_creds_path, scopes)
                creds = flow.run_local_server(port=0)
            
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
        
        return creds
    
