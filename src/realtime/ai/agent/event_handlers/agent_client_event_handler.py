import base64
from typing import Callable, Dict, Any
import json

from loguru import logger
from db.database import save_realtime_session_item_to_db

class ClientEventHandler:
    """Handles mapping of cleint websocket events to their corresponding methods."""

    def __init__(self, client):
        """Initialize the event handler with event mappings."""
        from ai.agent.openai_realtime_agent_client import OpenaiRealtimeAgentClient

        self.client: OpenaiRealtimeAgentClient = client
        self.event_map: Dict[str, Callable[[Any], None]] = {
            "input_audio_buffer.commit": self.handle_input_audio_buffer_commit,
            "input_audio_buffer.append": self.handle_input_audio_buffer_append,
            "conversation.item.create": self.handle_conversation_item_create,
            "response.create": self.handle_response_create,
            "response.cancel": self.handle_response_cancel,
            "session.update": self.handle_session_update,
        }

    async def handle_event(self, data: Dict[str, Any]) -> None:
        """Handle incoming event by calling the appropriate method."""
        event_type = data.get("type")

        logger.debug(f"Processing event type: {event_type}")

        handler = self.event_map.get(event_type, self.unknown_event_handler)
        await handler(data)
        await save_realtime_session_item_to_db(data=data, connection_key=self.client.connection_key)

    async def unknown_event_handler(self, data: Dict[str, Any]) -> None:
        """Default handler for unknown events."""
        logger.error(f"Unknown event type received: {json.dumps(data, indent=2)}")
        return

    async def handle_input_audio_buffer_commit(self, data: Dict[str, Any]) -> None:
        # commit_event = {"type": "input_audio_buffer.commit"}
        await self.client.send_server(data)

    async def handle_input_audio_buffer_append(self, data: Dict[str, Any]) -> None:
        await self.client.send_server(data)

    async def handle_conversation_item_create(self, data):
        await self.client.send_server(data)

    async def handle_response_create(self, data):
        await self.client.request_response(data)

    async def handle_response_cancel(self, data):
        await self.cancel_response()

    async def handle_session_update(self, data: dict):
        pass
        # await self.client.update_session(data)

    async def send_audio(self, audio_bytes: bytes) -> None:
        """Send audio data to the API."""
        # Convert audio to base64
        pcm_data = base64.b64encode(audio_bytes).decode()
        logger.debug(f"Sending audio data of type: {type(audio_bytes)}")

        # Append audio to buffer
        append_event = {"type": "input_audio_buffer.append", "audio": pcm_data}
        await self.client.send_server(append_event)

    async def cancel_response(self) -> None:
        """Cancel the current response."""
        event = {"type": "response.cancel"}
        await self.client.send_server(event)
