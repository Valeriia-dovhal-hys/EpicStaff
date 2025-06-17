from chunkers.base_chunker import BaseChunker
from langchain_text_splitters import TokenTextSplitter


class TokenChunker(BaseChunker):
    def __init__(self, chunk_size, chunk_overlap, additional_params):
        self.text_splitter = TokenTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )

    def chunk(self, text):
        return self.text_splitter.split_text(text)
