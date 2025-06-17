from chunkers.base_chunker import BaseChunker
from langchain_text_splitters import RecursiveJsonSplitter
import json


class JSONChunker(BaseChunker):
    def __init__(self, chunk_size, chunk_overlap):
        self.chunk_overlap = chunk_overlap
        self.json_splitter = RecursiveJsonSplitter(max_chunk_size=chunk_size)

    def chunk(self, text):
        json_obj = self._convert_text_to_json(text)
        return self.json_splitter.split_text(json_obj)

    def _convert_text_to_json(self, json_text: str) -> dict | list:
        return json.loads(json_text)
