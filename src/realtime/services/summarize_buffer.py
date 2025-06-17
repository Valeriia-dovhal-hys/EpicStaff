from loguru import logger

from ai.summarization.openai_summarization_client import OpenaiSummarizationClient
from services.chat_buffer import ChatSummarizedBuffer


class ChatSummarizedBufferClient:
    """
    Client for managing and summarizing chat buffers using OpenAI summarization.

    This client works with a buffer of chat messages, summarizes them using the
    provided OpenAI summarization client, and manages summarized chunks.
    """

    def __init__(
        self,
        buffer: ChatSummarizedBuffer,
        summ_client: OpenaiSummarizationClient,
    ):
        """
        Initializes the ChatBufferSummarizationClient.

        Args:
            buffer (ChatSummarizedBuffer): The chat buffer containing text to be summarized
                and chunks with summarized text.
            summ_client (OpenaiSummarizationClient): The client used to perform the summarization.
        """
        self.buffer = buffer
        self.summ_client = summ_client

    async def summarize_buffer(self) -> None:
        """
        Summarizes the current buffer content and appends the result to the chunks.

        - If the chunk storage is full, summarizes the existing chunks first.
        - Joins the buffer into a single string and summarizes it using the summarization client.
        - On success, clears the buffer and appends the summary as a new chunk.
        """
        buffer_data = self.buffer.get_buffer()
        buffer_text = " ".join(buffer_data)

        free_chunks = self.buffer.check_free_chunks()
        if not free_chunks:
            # if chunks are full -- summarize them with a separate request
            await self.summarize_chunks()

        logger.debug(f"Preparing to summarize the buffer")
        summarized_text: str = await self.summ_client.summarize_buffer(buffer_text)
        if not summarized_text:
            logger.error(f"Couldn't summarize the buffer")
            return

        logger.debug(f"Buffer was successfully summarized")
        self.buffer.flush_buffer()
        self.buffer.append_chunk(summarized_text)

    async def summarize_chunks(self):
        """
        Summarizes all current chunks and appends the result as a new chunk.

        - Joins all existing summarized chunks into one string.
        - Summarizes them again (meta-summarization).
        - On success, clears the chunks and appends the new summary.
        """
        chunks_data = self.buffer.get_chunks()
        chunks_text = " ".join(chunks_data)

        logger.debug(f"Preparing to summarize the chunks")
        summarized_chunks = await self.summ_client.summarize_chunks(chunks_text)
        if not summarized_chunks:
            logger.error(f"Couldn't summarize the chunks")
            return

        logger.debug(f"Chunks were successfully summarized")
        self.buffer.flush_chunks()
        self.buffer.append_chunk(summarized_chunks)
