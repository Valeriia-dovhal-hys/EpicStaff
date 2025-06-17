import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from models.request_models import RealtimeAgentChatData
from models.ai_models import RealtimeTool
from ai.agent.openai_realtime_agent_client import (
    OpenaiRealtimeAgentClient,
    TurnDetectionMode,
)
from utils.shorten import shorten_dict
from services.python_code_executor_service import PythonCodeExecutorService
from services.redis_service import RedisService
from services.tool_manager_service import ToolManagerService
from ai.transcription.realtime_transcription import (
    OpenaiRealtimeTranscriptionClient,
)
from ai.agent.openai_realtime_agent_client import (
    OpenaiRealtimeAgentClient,
)
from services.chat_mode import ChatMode


class ChatExecutor:
    def __init__(
        self,
        client_websocket: WebSocket,
        realtime_agent_chat_data: RealtimeAgentChatData,
        instructions: str,
        redis_service: RedisService,
        python_code_executor_service: PythonCodeExecutorService,
        tool_manager_service: ToolManagerService,
        connections: dict[
            WebSocket,
            list[OpenaiRealtimeAgentClient, OpenaiRealtimeTranscriptionClient],
        ],
    ):
        self.client_websocket = client_websocket
        self.realtime_agent_chat_data = realtime_agent_chat_data
        self.instructions = instructions
        self.redis_service = redis_service
        self.python_code_executor_service = python_code_executor_service
        self.tool_manager_service = tool_manager_service
        self.connections = connections
        self.wake_word = realtime_agent_chat_data.wake_word
        self.current_chat_mode = ChatMode.LISTEN

        self.tool_manager_service.register_tools_from_rt_agent_chat_data(
            realtime_agent_chat_data=realtime_agent_chat_data, chat_executor=self
        )

    async def initialize_clients(
        self,
    ) -> tuple[OpenaiRealtimeAgentClient, OpenaiRealtimeTranscriptionClient]:
        buffer = []
        rt_tools = await self.tool_manager_service.get_realtime_tool_models(
            connection_key=self.realtime_agent_chat_data.connection_key
        )
        rt_agent_client = OpenaiRealtimeAgentClient(
            api_key=self.realtime_agent_chat_data.rt_api_key,
            connection_key=self.realtime_agent_chat_data.connection_key,
            client_websocket=self.client_websocket,
            tool_manager_service=self.tool_manager_service,
            rt_tools=rt_tools,
            model=self.realtime_agent_chat_data.rt_model_name,
            voice=self.realtime_agent_chat_data.voice,
            instructions=self.instructions,
            temperature=self.realtime_agent_chat_data.temperature,
            turn_detection_mode=TurnDetectionMode.SERVER_VAD,
        )

        rt_transcription_client = OpenaiRealtimeTranscriptionClient(
            api_key=self.realtime_agent_chat_data.transcript_api_key,
            connection_key=self.realtime_agent_chat_data.connection_key,
            client_websocket=self.client_websocket,
            model="whisper-1",
            temperature=self.realtime_agent_chat_data.temperature,
            language=self.realtime_agent_chat_data.language,
            voice_recognition_prompt=self.realtime_agent_chat_data.voice_recognition_prompt,
            buffer=buffer,
        )

        return rt_agent_client, rt_transcription_client

    async def execute(self):
        try:
            await self.client_websocket.accept(subprotocol="openai-beta.realtime-v1")

            rt_agent_client_message_handler = None
            rt_transcription_client_message_handler = None

            # Initialize OpenAI handler with callbacks
            rt_agent_client, rt_transcription_client = await self.initialize_clients()

            await rt_agent_client.connect()
            await rt_transcription_client.connect()

            self.connections[self.client_websocket] = (
                rt_agent_client,
                rt_transcription_client,
            )
            rt_agent_client_message_handler = asyncio.create_task(
                rt_agent_client.handle_messages()
            )
            rt_transcription_client_message_handler = asyncio.create_task(
                rt_transcription_client.handle_messages()
            )

            logger.info("WebSocket connection established")

            last_buffer_element_index = 0
            # Main communication loop
            while True:
                if self.current_chat_mode == ChatMode.LISTEN:
                    client = rt_transcription_client
                    buffer: list[str] = (
                        rt_transcription_client.get_transcription_buffer()
                    )

                    buffer_delta: list[str] = buffer[last_buffer_element_index:]
                    for line in buffer_delta:
                        normalized_line = line.strip().lower()
                        if any(
                            trigger in normalized_line
                            for trigger in [
                                self.wake_word.lower().strip()
                            ]  # TODO: REFACTOR
                        ):
                            await rt_agent_client.send_conversation_item_to_server(
                                "\n".join(buffer)
                            )
                            await rt_agent_client.request_response()
                            rt_transcription_client.flush_buffer()
                            last_buffer_element_index = 0
                            self.current_chat_mode = ChatMode.CONVERSATION

                    last_buffer_element_index = len(buffer)

                else:
                    client = rt_agent_client

                try:
                    # Receive JSON message
                    message: dict = await self.client_websocket.receive_json()
                    logger.debug(f"Received message: {shorten_dict(message)}")

                    # Process message through OpenAI handler
                    response = await client.process_message(message)
                    if response:
                        logger.debug(f"Sending response: {response}")
                        await self.client_websocket.send_json(response)

                except json.JSONDecodeError:
                    logger.error("Invalid JSON format")
                    await self.client_websocket.send_json(
                        {"type": "error", "message": "Invalid JSON format"}
                    )

                except Exception as e:
                    logger.exception(f"Error processing message: {e}")
                    await self.client_websocket.send_json(
                        {"type": "error", "message": str(e)}
                    )

        except WebSocketDisconnect:
            logger.info("Client disconnected")
        except Exception as e:
            logger.exception("Unexpected exception")
        finally:
            # Clean up
            if (
                rt_agent_client_message_handler is not None
                and not rt_agent_client_message_handler.done()
            ):
                rt_agent_client_message_handler.cancel()

            if (
                rt_transcription_client_message_handler is not None
                and not rt_transcription_client_message_handler.done()
            ):
                rt_transcription_client_message_handler.cancel()

            if self.client_websocket in self.connections:
                await client.close()
                del self.connections[self.client_websocket]
