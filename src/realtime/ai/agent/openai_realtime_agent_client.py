from models.ai_models import RealtimeTool
import websockets
import json
from typing import Optional, List, Dict, Any
from enum import Enum

from ai.agent.event_handlers.agent_client_event_handler import ClientEventHandler
from ai.agent.event_handlers.agent_server_event_handler import ServerEventHandler

from services.tool_manager_service import ToolManagerService
from fastapi import WebSocket
from loguru import logger 

class TurnDetectionMode(Enum):
    SERVER_VAD = "server_vad"
    MANUAL = "manual"


class OpenaiRealtimeAgentClient:
    """
    A client for interacting with the OpenAI Realtime API.

    This class provides methods to connect to the Realtime API, send text and audio data,
    handle responses, and manage the WebSocket connection.
    """

    def __init__(
        self,
        api_key: str,
        connection_key: str,
        client_websocket: WebSocket,
        tool_manager_service: ToolManagerService,
        rt_tools: Optional[List[RealtimeTool]] = None,
        model: str = "gpt-4o-mini-realtime-preview-2024-12-17",
        voice: str = "alloy",
        instructions: str = "You are a helpful assistant",
        temperature: float = 0.8,
        turn_detection_mode: TurnDetectionMode = TurnDetectionMode.SERVER_VAD,
    ):
        self.api_key = api_key
        self.connection_key = connection_key
        self.client_websocket = client_websocket
        self.tool_manager_service = tool_manager_service
        self.model = model
        self.voice = voice
        self.ws = None
        self.instructions = instructions
        self.temperature = temperature
        self.base_url = "wss://api.openai.com/v1/realtime"
        self.turn_detection_mode = turn_detection_mode

        self.server_event_handler = ServerEventHandler(self)
        self.client_event_handler = ClientEventHandler(self)
        if rt_tools is None:
            rt_tools = []

        self.tools = []
        for rt_tool in rt_tools:
            if not isinstance(rt_tool, dict):
                rt_tool = rt_tool.model_dump()
            self.tools.append(rt_tool)

        # Track current response state
        self._current_response_id = None
        self._current_item_id = None
        self._is_responding = False
        # Track printing state for input and output transcripts
        self._print_input_transcript = False
        self._output_transcript_buffer = ""

    async def connect(self) -> None:
        """Establish WebSocket connection with the Realtime API."""
        url = f"{self.base_url}?model={self.model}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "realtime=v1",
        }

        self.ws = await websockets.connect(url, extra_headers=headers)

        await self.update_session(
            config={
                "modalities": ["text", "audio"],
                "instructions": self.instructions,
                "voice": self.voice,
                "tools": self.tools,
                "tool_choice": "auto",
                "temperature": self.temperature,
            }
        )

    async def send_client(self, data):
        await self.client_websocket.send_json(data)

    async def update_session(self, config: Dict[str, Any]) -> None:
        """Update session configuration."""
        voice = config.get("voice", self.voice)
        turn_detection = config.get(
            "turn_detection",
            {
                "type": "server_vad",
                "threshold": 0.5,
                "prefix_padding_ms": 500,
                "silence_duration_ms": 200,
            },
        )
        tool_choice = config.get("tool_choice", "auto")
        input_audio_transcription = config.get(
            "input_audio_transcription", {"model": "whisper-1"}
        )
        modalities = config.get("modalities", ["text", "audio"])
        temperature = config.get("temperature", self.temperature)

        data = {
            "modalities": modalities,
            "instructions": self.instructions,
            "voice": voice,
            "input_audio_format": "pcm16",
            "output_audio_format": "pcm16",
            "input_audio_transcription": input_audio_transcription,
            "turn_detection": turn_detection,
            "tools": self.tools,
            "tool_choice": tool_choice,
            "temperature": temperature,
        }

        event = {"type": "session.update", "session": data}

        await self.send_server(event)

    async def request_response(self, data: dict | None = None) -> None:
        """Request a response from the API. Needed when using manual mode."""
        response = {"modalities": ["text", "audio"], "tools": self.tools}

        if data is not None:
            client_response: dict = data.get("response")

            if client_response is not None:
                client_response_modalities = client_response.get(
                    "modalities", ["text", "audio"]
                )
                if client_response_modalities is not None:
                    response["modalities"] = client_response_modalities

        event = {
            "type": "response.create",
            "response": response,
        }

        await self.send_server(event)

    async def send_function_result(self, call_id: str, result: Any) -> None:
        """Send function call result back to the API."""
        event = {
            "type": "conversation.item.create",
            "item": {
                "type": "function_call_output",
                "call_id": call_id,
                "output": result,
            },
        }
        await self.send_server(event)

        # functions need a manual response
        # await self.request_response()

    async def call_tool(
        self, call_id: str, tool_name: str, tool_arguments: Dict[str, Any]
    ) -> None:
        # await self.send_function_result(
        #     call_id, str("Tool execution in progress. Wait.")
        # )

        tool_result = await self.tool_manager_service.execute(
            connection_key=self.connection_key,
            tool_name=tool_name,
            call_arguments=tool_arguments,
        )

        await self.send_function_result(call_id, str(tool_result))

    async def process_message(
        self, message: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Process incoming message from the frontend WebSocket."""
        return await self.client_event_handler.handle_event(data=message)
        # return {"type": "error", "message": f"Unknown message type: {message_type}"}

    async def handle_messages(self) -> None:
        """Handle incoming messages from the OpenAI API."""
        logger.info("Starting message handler...")
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)

                    await self.server_event_handler.handle_event(data)

                except json.JSONDecodeError:
                    logger.exception("Failed to decode API message")
                except Exception as e:
                    logger.exception(f"Error processing API message: {str(e)}")

        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
        except Exception as e:
            logger.exception(f"Error in message handler: {str(e)}")

    async def close(self) -> None:
        """Close the WebSocket connection."""
        if self.ws:
            await self.ws.close()

    async def send_server(self, event):
        await self.ws.send(json.dumps(event))
        
    async def send_conversation_item_to_server(self, text: str):

        event = {
            "type": "conversation.item.create",
            "item": {
                "id": "dont_show_it",
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": text}],
            },
        }
        await self.send_server(event=event)
