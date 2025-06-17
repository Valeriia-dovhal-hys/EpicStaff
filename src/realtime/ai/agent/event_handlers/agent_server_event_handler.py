from typing import Callable, Dict, Any, Coroutine
import json

from loguru import logger
from db.database import save_realtime_session_item_to_db


class ServerEventHandler:
    """Handles mapping of WebSocket events to their corresponding methods."""

    def __init__(self, client):
        """Initialize the event handler with event mappings."""
        from ai.agent.openai_realtime_agent_client import (
            OpenaiRealtimeAgentClient,
        )

        self.client: OpenaiRealtimeAgentClient = client
        self.event_map: Dict[str, Callable[[Any], Coroutine[Any, Any, None]]] = {
            "response": self.default_handler,
            "response.created": self.default_handler,
            "session.created": self.default_handler,
            "error": self.handle_error,
            "session.updated": self.default_handler,
            "conversation.item.created": self.conversation_item_created_handler,
            "rate_limits.updated": self.default_handler,
            "response.output_item.added": self.default_handler,
            "response.audio_transcript.delta": self.default_handler,
            "response.audio.delta": self.default_handler,
            "response.audio.done": self.default_handler,
            "response.audio_transcript.done": self.default_handler,
            "response.content_part.done": self.default_handler,
            "response.output_item.done": self.default_handler,
            "response.done": self.default_handler,
            "input_audio_buffer.speech_started": self.default_handler,
            "input_audio_buffer.committed": self.default_handler,
            "response.function_call_arguments.delta": self.handle_function_call_delta,
            "response.function_call_arguments.done": self.handle_function_call_done,
            "response.content_part.added": self.default_handler,
            "input_audio_buffer.speech_stopped": self.default_handler,
            "conversation.item.input_audio_transcription.delta": self.default_handler,
            "conversation.item.input_audio_transcription.completed": self.default_handler,
        }

    async def handle_event(self, data: Dict[str, Any]) -> None:
        """Handle incoming event by calling the appropriate method."""
        event_type = data.get("type", "")

        handler = self.event_map.get(event_type, self.unknown_event_handler)
        await handler(data)
        await save_realtime_session_item_to_db(
            data=data, connection_key=self.client.connection_key
        )

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

    async def conversation_item_created_handler(self, data: dict):
        if data["item"]["id"] == "dont_show_it":
            return

        await self.default_handler(data)
