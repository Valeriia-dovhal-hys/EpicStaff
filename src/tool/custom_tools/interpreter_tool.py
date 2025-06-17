import logging

logger = logging.getLogger(__name__)
logger.debug(f"Entered {__file__}")
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
#TODO: change import after update: from crewai.tools import BaseTool 
from typing import Type, Any
from langchain.tools import tool
from interpreter import interpreter
from langchain_openai import ChatOpenAI

from crewai_tools import PDFSearchTool
class CLIToolSchema(BaseModel):
    """
    Input schema for CLIToolTool, specifying the required parameters for executing code.
    """

    command: str = Field(..., description="command to be executed.")


class CLITool(BaseTool):
    """
    Tool to create and execute code using Open Interpreter.
    """

    name: str = "Executor"
    description: str = (
        "Tool to create and execute code using Open Interpreter. Takes in one parameter: 'command' - the command to be executed."
    )
    args_schema: Type[BaseModel] = CLIToolSchema

    def __init__(self, **kwargs):

        interpreter.auto_run = True
        # interpreter.offline = True # Disables online features like Open Procedures
        # interpreter.llm.model = "openai/x" # Tells OI to send messages in OpenAI's format
        # interpreter.llm.api_key = "fake_key" # LiteLLM, which we use to talk to LM Studio, requires this
        # interpreter.llm.api_base = "http://localhost:1234/v1" # Point this at any OpenAI compatible server
        interpreter.llm.context_window = 32768  # TODO remove hardcoding

        try:
            model = kwargs["config"]["llm"]["model"]
        except Exception as e:
            model = None
         
        interpreter.llm.model = model if model is not None else "openai/gpt-4o" 
        
        super().__init__(**kwargs)
        self._generate_description()  # Call to the inherited method to set the initial description

    def _run(self, **kwargs: Any) -> Any:
        command = kwargs.get("command")
        if not command:
            return "Error: No command provided for executing. Please provide a command as the 'command' parameter."

        interpreter.anonymized_telemetry = False
        result = interpreter.chat(command)

        return str(result)
