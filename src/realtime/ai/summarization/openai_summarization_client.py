from loguru import logger

import litellm


class OpenaiSummarizationClient:
    """
    A client for summarizing text using OpenAI's API via the litellm library.

    This class provides asynchronous methods to send text to OpenAI's language models
    (e.g., GPT-4) for summarization. It supports both direct summarization of a buffer
    and summarization with chunk-specific instructions.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
    ):
        self.__api_key = api_key
        self.model = model

    async def _summarize(self, messages: list[dict]) -> str:
        """
        Sends a request to openai with text to summarize it.

        Returns the summarized text
        """
        try:
            response = await litellm.acompletion(
                model=self.model,
                messages=messages,
                api_key=self.__api_key,
            )

            summarized_text = response["choices"][0]["message"]["content"]
            logger.debug(f"Text was successfully summarized:\n\n{summarized_text}\n")

            return summarized_text
        except Exception as e:
            logger.exception("Error during litellm completion request")
            return ""

    async def summarize_buffer(self, to_summarize: str) -> str:
        """
        Sends a request to openai with text from buffer to summarize it.

        Returns the summarized text
        """
        if not to_summarize:
            logger.error(
                f"Couldn't summarize the buffer. Parameter 'to_summarize' cannot be empty"
            )
            return ""

        logger.debug(f"Received text (buffer) to summarize:\n\n{to_summarize}\n")

        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that summarizes "
                "text clearly and concisely. Summarize the text "
                "using the same language it is written in.",
            },
            {
                "role": "user",
                "content": f"Summarize the following text in the same"
                f" language it was originally written in.:\n{to_summarize}",
            },
        ]

        return await self._summarize(messages)

    async def summarize_chunks(self, to_summarize: str):
        """
        Sends a request to openai with text from chunks to summarize it.

        Returns the summarized text
        """
        if not to_summarize:
            logger.error(
                f"Couldn't summarize the chunks. Parameter 'to_summarize' cannot be empty"
            )
            return ""

        logger.debug(f"Received text (chunks) to summarize:\n\n{to_summarize}\n")

        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that summarizes "
                "text clearly and concisely. Summarize the text "
                "using the same language it is written in. And make it shorter. "
                "Text written in the top must be compressed more than the text in the bottom",
            },
            {
                "role": "user",
                "content": f"Summarize the following text in the same"
                f" language it was originally written in.:\n{to_summarize}",
            },
        ]
        return await self._summarize(messages)
