import os
import sys

from rich.table import Table
import sentry_sdk

from utils.cli_parser import get_parser
from utils.helpers import load_env, is_valid_google_sheets_url, get_sheet_url_from_user
from utils import Sheets, helpers
from config.config import AppConfig
from bootstrap import logger, console
from crew_runner import create_agents_from_df, create_tasks_from_df, create_crew


if __name__ == "__main__":
    release = f"{AppConfig.name}@{AppConfig.version}"
    if os.environ.get("CREWAI_SHEETS_SENRY") != "False":
        sentry_sdk.init(
            dsn="https://fc662aa323fcc1629fb9ea7713f63137@o4507186870157312.ingest.de.sentry.io/4507186878414928",
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
            release=release,
        )
    helpers.greetings_print()
    args = get_parser()
    log_level = args.loglevel.upper() if hasattr(args, "loglevel") else "ERROR"
    logger.setLevel(log_level)

    load_env(
        args.env_path,
        [
            "OPENAI_API_KEY",
        ],
    )

    if (
        hasattr(args, "sheet_url")
        and args.sheet_url
        and is_valid_google_sheets_url(args.sheet_url)
    ):
        sheet_url = args.sheet_url
    else:
        sheet_url = get_sheet_url_from_user()

    # Define a function to handle termination signals
    terminal_width = console.width
    terminal_width = max(terminal_width, 120)

    # Enter main process
    agents_df, tasks_df, crew_df, models_df, tools_df = Sheets.parse_table(sheet_url)
    helpers.after_read_sheet_print(
        agents_df, tasks_df
    )  # Print overview of agents and tasks

    # Create Agents
    agents_df["crewAIAgent"] = agents_df.apply(
        lambda row: create_agents_from_df(row, models_df=models_df, tools_df=tools_df),
        axis=1,
    )
    created_agents = agents_df["crewAIAgent"].tolist()

    # Create Tasks
    assignment = crew_df["Assignment"][0]
    tasks_df["crewAITask"] = tasks_df.apply(
        lambda row: create_tasks_from_df(row, assignment, created_agents), axis=1
    )
    created_tasks = tasks_df["crewAITask"].tolist()

    # Creating crew
    crew = create_crew(created_agents, created_tasks, crew_df, models_df)
    console.print(
        "[green]I've created the crew for you. Let's start working on these tasks! :rocket: [/green]"
    )

    try:
        results = crew.kickoff()
    except Exception as e:
        console.print(
            f"[red]I'm sorry, I couldn't complete the tasks :( Here's the error I encountered: {e}"
        )
        sys.exit(0)

    # Create a table for results
    result_table = Table(show_header=True, header_style="bold magenta")
    result_table.add_column(
        "Here are the results, see you soon =) ", style="green", width=terminal_width
    )

    result_table.add_row(str(results))
    console.print(result_table)
    console.print("[bold green]\n\n")
