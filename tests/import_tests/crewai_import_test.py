from typing import List
import pytest
import pytest_mock
import pandas as pd
from utils.sheets_loader import Sheets
from pytest_mock import MockerFixture, mocker

from utils.tools_mapping import ToolsMapping


class TestImport:
    resources = "tests/resources/"
    dataframe_names = ("agents", "tasks", "crew", "models", "tools")
    sheet_url = "https://docs.google.com/spreadsheets/d/1HXOAB7SLhnO9gYWFQj4l-vna9_80QoeJIp_kCEouFY0/edit?gid=868167866#gid=868167866"

    # def test_create_csv_from_gsheet(
    #     self,
    #     mocker,
    # ):
    #     dataframes: List[pd.DataFrame] = Sheets.read_google_sheet(
    #         "https://docs.google.com/spreadsheets/d/1HXOAB7SLhnO9gYWFQj4l-vna9_80QoeJIp_kCEouFY0/edit?gid=868167866#gid=868167866"
    #     )
    #     for name, dataframe in zip(self.dataframe_names, dataframes):
    #         dataframe.to_csv(f"{self.resources}{name}.csv", index=False)

    def load_dataframes(self):
        return [
            pd.read_csv(f"{self.resources}{name}.csv") for name in self.dataframe_names
        ]

    def test_import_tools(self, mocker: MockerFixture):

        loaded_df = self.load_dataframes()

        mocker.patch(
            "utils.sheets_loader.Sheets.read_google_sheet", return_value=loaded_df
        )

        agents_df, tasks_df, crew_df, models_df, tools_df = Sheets.parse_table(
            self.sheet_url
        )

        print(tools_df)
