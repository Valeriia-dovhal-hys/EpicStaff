import sys

from rich.table import Table

from .utils import Sheets, helpers
from .utils.bootstrap import Bootstrapper as bst
from .utils.crew_runner import create_agents_from_df, create_tasks_from_df, create_crew


if __name__ == "__main__":
    
    bst.set_logger()
    bst.set_envvars()
    bst.prepare_console()

    console = bst.console
    terminal_width = bst.terminal_width
    sheet_url = bst.sheet_url

    # Enter main process
    agents_df, tasks_df, crew_df, models_df, tools_df = Sheets.parse_table(sheet_url)
    helpers.after_read_sheet_print(
        agents_df, tasks_df
    )

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
