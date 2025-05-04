import logging
import json
from pathlib import Path
logger = logging.getLogger(__name__)
from urllib.error import URLError
from textwrap import dedent
import pandas as pd
import sys
from io import StringIO
import requests
from requests.exceptions import HTTPError

from config.config import AppConfig
from utils.helpers import get_sheet_url_from_user
from utils.auth_manager import AuthManager

template_sheet_url = AppConfig.template_sheet_url


class SheetsManager:

    @staticmethod
    def read_google_sheet(base_url, creds=None):

        # Extract the base URL from the provided Google Sheet URL
        dataframes = []

        # Define the worksheets and their respective columns to be read
        worksheets = {}
        with open("src/config/worksheets_config.json", "r") as f:
            worksheets = json.load(f)

        dispatcher = {
            "Agents": SheetsManager._process_agents_df,
            "Models": SheetsManager._process_models_df,
            "Tasks": SheetsManager._process_tasks_df,
            "Crew": SheetsManager._process_crew_df,
            "Tools": SheetsManager._process_tools_df,
        }

        for worksheet, columns in worksheets.items():

            url = f"{base_url}/gviz/tq?tqx=out:csv&sheet={worksheet}"

            # Read the worksheet into a DataFrame, selecting only the specified columns
            try:
                headers = {
                    'Authorization': f'Bearer {creds.token}'
                } if creds is not None else {}

                response = requests.get(url, headers=headers)
                csv_like = StringIO(response.text)

                data = pd.read_csv(csv_like, usecols=columns)
                dispatcher[worksheet](data=data, columns=columns)
            except Exception as e:
                return e

            data = data.where(pd.notnull(data), None)  # Replace NaN values with None

            # Append the DataFrame to the list of dataframes
            dataframes.append(data)

        return dataframes

    @staticmethod
    def _process_agents_df(*, data, **kwargs):
        data.dropna(subset=["Agent Role"], inplace=True)

        for col in [
            "Agent Role",
            "Goal",
            "Backstory",
            "Tools",
            "Model Name",
            "Function Calling Model",
        ]:
            data[col] = data[col].astype(str).apply(dedent).replace("None", None)

        for col in ["Tools"]:
            data[col] = data[col].replace("\n", "")
        for col in ["Allow delegation", "Verbose", "Memory"]:
            data[col] = data[col].astype(bool)

        data["Temperature"] = data["Temperature"].astype(float)
        data["Max_iter"] = data["Max_iter"].astype(int)

    @staticmethod
    def _process_models_df(*, data, **kwargs):
        data["Context size (local only)"] = data["Context size (local only)"].replace(
            0, None
        )
        data["base_url"] = data["base_url"].replace("None", None)
        data["Deployment"] = data["Deployment"].replace("None", None)

    @staticmethod
    def _process_tasks_df(*, data, columns, **kwargs):
        # check if all columns are present are string. If not, print error and exit
        for col in columns:
            # convert all columns to string
            data[col] = data[col].astype(str)
            if data[col].dtype != "object":
                raise ValueError(f"Column '{col}' is not of type 'Plain Text'.")

    @staticmethod
    def _process_crew_df(*, data, **kwargs):
        for col in [
            "Team Name",
            "Assignment",
            "Process",
            "Embedding model",
            "Manager LLM",
        ]:
            data[col] = (
                data[col]
                .astype(str)
                .apply(dedent)
                .replace("None", None)
                .replace("nan", None)
            )
        for col in ["Verbose", "Memory"]:
            data[col] = data[col].astype(bool)
        data["t"] = data["t"].astype(float)
        data["num_ctx"] = data["num_ctx"].astype(int).replace(0, None)

    @staticmethod
    def _process_tools_df(*, data, **kwargs):
        data.replace("None", None, inplace=True)

    @staticmethod
    def parse_table(url=template_sheet_url):
        creds = None

        try:
            response = requests.get(url=url)
            response.raise_for_status()
        except HTTPError as http_err:
            if response.status_code == 401:
                creds = AuthManager.authenticate_google_user()
            else:
                raise Exception(f"HTTP Error occured: {http_err}")
            
        base_url = url.split("/edit")[0]

        num_att = 0
        while num_att < 10:
            try:
                dataframes = SheetsManager.read_google_sheet(base_url, creds)
                if isinstance(dataframes, Exception):
                    raise dataframes
                break
            except ValueError as e:
                logger.error(f"ValueError occurred: {e}")
                print(f"Oops! Something went bonkers with the sheet. {e}")
                url = get_sheet_url_from_user()
                num_att += 1
            except URLError as e:
                logger.error(f"URLError occurred: {e}")
                print(
                    f"Trying to open '{url}' and I'm all thumbs (which is sad because I don't have any)! Can you check that URL for me? {e}"
                )
                url = get_sheet_url_from_user()
                num_att += 1
        else:
            print(
                "10 attempts? Is this a new world record? I'm not equipped for marathons! Gotta hit the shutdown button now."
            )
            sys.exit(0)

        Agents, Tasks, Crew, Models, Tools = dataframes

        return Agents, Tasks, Crew, Models, Tools

        # from sqlalchemy import create_engine
        # engine = create_engine('sqlite:///my_database.db')

        # # Write DataFrames to SQL tables
        # Agents.to_sql('Agents', con=engine, index=False, if_exists='replace')
        # Tasks.to_sql('Tasks', con=engine, index=False, if_exists='replace')
        # Crew.to_sql('Crew', con=engine, index=False, if_exists='replace')
        # Models.to_sql('Models', con=engine, index=False, if_exists='replace')
        # Tools.to_sql('Tools', con=engine, index=False, if_exists='replace')
