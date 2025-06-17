from typing import Callable, Dict, Any
import json

from loguru import logger
from db.database import save_realtime_session_item_to_db

class TranscriptionServerEventHandler:
    """Handles mapping of WebSocket events to their corresponding methods."""

    def __init__(self, client, transcription_buffer: list[str]):
        self.transcription_buffer: list[str] = transcription_buffer
        """Initialize the event handler with event mappings."""
        from ai.transcription.realtime_transcription import (
            OpenaiRealtimeTranscriptionClient,
        )

        self.client: OpenaiRealtimeTranscriptionClient = client
        self.event_map: Dict[str, Callable[[Any], None]] = {
            "response": self.default_handler,
            "response.created": self.default_handler,
            "session.created": self.default_handler,
            "error": self.handle_error,
            "session.updated": self.default_handler,
            "conversation.item.created": self.default_handler,
            "rate_limits.updated": self.default_handler,
            "input_audio_buffer.speech_started": self.default_handler,
            "input_audio_buffer.committed": self.default_handler,
            "response.content_part.added": self.default_handler,
            "input_audio_buffer.speech_stopped": self.default_handler,
            "conversation.item.input_audio_transcription.delta": self.default_handler,
            "conversation.item.input_audio_transcription.completed": self.input_audio_transcription_completed_handler,
            "transcription_session.created": self.transcription_session_created_handler,
        }

    async def handle_event(self, data: Dict[str, Any]):
        """Handle incoming event by calling the appropriate method."""
        event_type = data.get("type", "")
        handler = self.event_map.get(event_type, self.unknown_event_handler)
        await handler(data)
        await save_realtime_session_item_to_db(data=data, connection_key=self.client.connection_key)

    async def default_handler(self, data: Dict[str, Any]) -> None:
        await self.client.send_client(data)

    async def unknown_event_handler(self, data: Dict[str, Any]) -> None:
        """Default handler for unknown events."""
        logger.warning(f"Unknown event type received: {json.dumps(data, indent=2)}")

        await self.default_handler(data)

    async def handle_error(self, data: Dict[str, Any]) -> None:
        logger.error(f"Error received: {data}")
        await self.default_handler(data)

    async def handle_function_call_delta(self, data: Dict[str, Any]) -> None:
        pass

    async def handle_function_call_done(self, data: Dict[str, Any]) -> None:
        # asyncio.create_task(
        await self.client.call_tool(
            call_id=data["call_id"],
            tool_name=data["name"],
            tool_arguments=json.loads(data["arguments"]),
        )
        # )
        await self.default_handler(data)

    async def transcription_session_created_handler(self, data):
        pass

    async def input_audio_transcription_completed_handler(self, data: dict):
        self.transcription_buffer.append(data["transcript"])

        await self.default_handler(data)
