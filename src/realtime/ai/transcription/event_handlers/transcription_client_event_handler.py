import base64
from typing import Callable, Dict, Any
import json

from loguru import logger
from db.database import save_realtime_session_item_to_db

class TransciptionClientEventHandler:
    """Handles mapping of cleint websocket events to their corresponding methods."""

    def __init__(self, client, buffer: list[str]):
        """Initialize the event handler with event mappings."""
        from ai.agent.openai_realtime_agent_client import OpenaiRealtimeAgentClient

        self.client: OpenaiRealtimeAgentClient = client
        self.event_map: Dict[str, Callable[[Any], None]] = {
            "input_audio_buffer.append": self.handle_input_audio_buffer_append,
            "session.update": self.handle_session_update,
            "conversation.item.create": self.handle_conversation_item_create,
        }
        self.buffer = buffer

    async def handle_event(self, data: Dict[str, Any]) -> None:
        """Handle incoming event by calling the appropriate method."""
        event_type = data.get("type")

        logger.debug(f"Processing event type: {event_type}")

        handler = self.event_map.get(event_type, self.unknown_event_handler)
        await handler(data)
        await save_realtime_session_item_to_db(data=data, connection_key=self.client.connection_key)

    async def unknown_event_handler(self, data: Dict[str, Any]) -> None:
        """Default handler for unknown events."""
        logger.warning(f"Unknown event type received: {json.dumps(data, indent=2)}")

    async def handle_input_audio_buffer_commit(self, data: Dict[str, Any]) -> None:
        await self.client.send_server(data)

    async def handle_input_audio_buffer_append(self, data: Dict[str, Any]) -> None:
        await self.client.send_server(data)

    async def handle_session_update(self, data: dict):
        pass
        # await self.client.update_session(data)

    async def handle_conversation_item_create(self, data: dict):
        text = data["item"]["content"][0]["text"]
        self.buffer.append(text)

        import uuid

        event_id = f"event_{str(uuid.uuid4())}"
        item_id = f"item_{str(uuid.uuid4())}"


        e4 = {
            "type": "conversation.item.created",
            "event_id": event_id,
            "previous_item_id": None,
            "item": {
                "id": item_id,
                "object": "realtime.item",
                "type": "message",
                "status": "completed",
                "role": "user",
                "content": [{"type": "input_audio", "transcript": None}],
            },
        }

        e6 = {
            "type": "conversation.item.input_audio_transcription.completed",
            "event_id": event_id,
            "item_id": item_id,
            "content_index": 0,
            "transcript": f"{text}\n",
        }

        await self.client.send_client(e4)
        await self.client.send_client(e6)
