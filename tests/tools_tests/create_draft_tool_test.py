import pytest
import pytest_mock
from pytest_mock import mocker
from unittest.mock import patch
from crewai import Agent, Task
from crewai_tools import tool

from tests.mocks.tools_mocks import mock_file_with_content, mock_empty_file
from src.tools.create_draft_tool import CreateDraftTool

# todo: Ensure that create draft tool works
class TestCreateDraftTool:


    def test_create_draft(self, mocker):
        """Test create draft"""
        pass


    @pytest.mark.vcr(filter_headers=["authorization"], record_mode="once")
    def test_email_draft_tool(self, mocker):
        """Test email draft tool usage with crewai interface"""

        mocked_email = "dummy@donotexist.com"
        mocked_title = "Nice To Meet You"
        mocked_message = "Hey, it was great to meet you!"

        @tool("Mocked draft creation tool")
        def create_draft_mocked(data: str):
            """
            Useful to create an email draft.
            The input to this tool should be a pipe (|) separated string
            of length 3 (three), representing who to send the email to,
            the subject of the email and the actual message.
            For example, `lorem@ipsum.com|Nice To Meet You|Hey it was great to meet you.`.
            """

            mocked_tool = mocker.patch("src.tools.create_draft_tool.CreateDraftTool.create_draft", return_value="Draft created")
            return CreateDraftTool.create_draft(data)

        agent = Agent(
            role="test role",
            goal="test goal",
            tools=[create_draft_mocked],
            backstory="test backstory",
            allow_delegation=False,
        )

        task = Task(
            description=f"""Create a draft email to {mocked_email} with 
            a title of '{mocked_title}' and message '{mocked_message}'
            """,
            agent=agent,
            expected_output="""The draft was created succesfully for (recipient)
            with the title '(title)' and message '(message)'.
            """,
        )
        
        output = agent.execute_task(task)
        assert output == f"The draft was created successfully for {mocked_email} with the title '{mocked_title}' and message '{mocked_message}'."
