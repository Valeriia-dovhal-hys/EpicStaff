import tiktoken
from loguru import logger


class Tokenizer:
    """
    A class for tokenizing and detokenizing text using the tiktoken library.

    This class provides methods to encode text into tokens and decode tokens back into text
    for a specified OpenAI model.
    """
    def __init__(self, model):
        self._tokenizer = self.__set_tokenizer(model)

    def __set_tokenizer(self, model):
        try:
            self._tokenizer = tiktoken.encoding_for_model(model)
            return self._tokenizer
        except KeyError:
            logger.error(f"Model '{model}' is not supported by tiktoken.")
            return None

    def tokenize(self, text: str) -> list[int]:
        return self._tokenizer.encode(text)

    def detokenize(self, tokens: list[int]) -> str:
        return self._tokenizer.decode(tokens)
