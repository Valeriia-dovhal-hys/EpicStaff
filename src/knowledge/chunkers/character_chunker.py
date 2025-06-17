from chunkers.base_chunker import BaseChunker
from langchain_text_splitters import CharacterTextSplitter
import re
from loguru import logger


class CharacterChunker(BaseChunker):
    def __init__(self, chunk_size, chunk_overlap, additional_params):

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.regex_pattern = additional_params.get("regex", None)

    def chunk(self, text):
        text = text.replace("\r", "")

        try:
            parts = re.split(self.regex_pattern, text) if self.regex_pattern else [text]
        except re.error as e:
            logger.error(f"Error with RegEx {self.regex_pattern}. {e}")
            return []

        chunks = []
        step = self.chunk_size - self.chunk_overlap
        for part in parts:
            part = part.strip()
            if part:
                chunks.extend(
                    [part[i : i + self.chunk_size] for i in range(0, len(part), step)]
                )
        return chunks
