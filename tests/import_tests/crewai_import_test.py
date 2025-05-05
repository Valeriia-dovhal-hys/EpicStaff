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

    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_import_tools(self):

        agents_df, tasks_df, crew_df, models_df, tools_df = Sheets.parse_table(
            self.sheet_url
        )
        tools_mapping = ToolsMapping(
            tools_df, models_df
        )  # Get the ToolsMapping instance
        tools_dict = (
            tools_mapping.get_tools()
        )  # Get the dictionary of tools from the instance
        

