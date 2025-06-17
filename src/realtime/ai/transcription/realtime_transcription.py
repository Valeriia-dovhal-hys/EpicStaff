from loguru import logger
import websockets
import json
from typing import Optional, Dict, Any

from ai.transcription.event_handlers.transcription_client_event_handler import (
    TranscriptionClientEventHandler,
)
from ai.transcription.event_handlers.transcription_server_event_handler import (
    TranscriptionServerEventHandler,
)

from fastapi import WebSocket

from services.chat_buffer import ChatSummarizedBuffer


class OpenaiRealtimeTranscriptionClient:
    def __init__(
        self,
        api_key: str,
        connection_key: str,
        client_websocket: WebSocket,
        model: str,
        language: str | None,
        voice_recognition_prompt: str | None,
        buffer: ChatSummarizedBuffer,
        temperature: float = 0.8,
    ):
        self.api_key = api_key
        self.connection_key = connection_key
        self.client_websocket = client_websocket
        self.model = model
        self.ws = None
        self.language = language
        self.voice_recognition_prompt = voice_recognition_prompt
        self.temperature = temperature
        self.base_url = "wss://api.openai.com/v1/realtime"
        self.turn_detection_mode = "server_vad"

        self.buffer = buffer
        self.words_qty_in_buffer: int = 0

        self.server_event_handler = TranscriptionServerEventHandler(
            self, transcription_buffer=self.buffer
        )
        self.client_event_handler = TranscriptionClientEventHandler(self, buffer=buffer)

    async def connect(self) -> None:
        """Establish WebSocket connection with the Realtime transcription API."""
        url = f"{self.base_url}?intent=transcription"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "OpenAI-Beta": "realtime=v1",
        }

        self.ws = await websockets.connect(url, extra_headers=headers)

        await self.update_session()

    async def send_client(self, data):
        await self.client_websocket.send_json(data)

    async def update_session(self) -> None:
        """Update session configuration."""

        data = {
            "type": "transcription_session.update",
            "session": {
                "input_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": self.model,
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 500,
                },
                "input_audio_noise_reduction": {"type": "near_field"},
                "include": [
                    "item.input_audio_transcription.logprobs",
                ],
            },
        }
        if self.language is not None:
            data["session"]["input_audio_transcription"]["language"] = self.language

        if self.voice_recognition_prompt is not None:
            data["session"]["input_audio_transcription"][
                "prompt"
            ] = self.voice_recognition_prompt

        await self.send_server(data)

    async def process_message(
        self, message: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Process incoming message from the frontend WebSocket."""
        return await self.client_event_handler.handle_event(data=message)

    async def handle_messages(self) -> None:
        """Handle incoming messages from the OpenAI API."""
        logger.info("Starting message handler...")
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)

                    await self.server_event_handler.handle_event(data)

                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode API message {e}")
                except Exception as e:
                    logger.exception(f"Error processing API message")

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket connection {self.connection_key} closed")
        except Exception as e:
            logger.exception(f"Error in message handler")

    async def close(self) -> None:
        """Close the WebSocket connection."""
        if self.ws:
            await self.ws.close()

    async def send_server(self, event: dict):
        await self.ws.send(json.dumps(event))

    def get_transcription_buffer(self) -> ChatSummarizedBuffer:
        return self.buffer

    # def flush_buffer(self):
    #     self.buffer.flush()
