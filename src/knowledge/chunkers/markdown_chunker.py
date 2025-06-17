from chunkers.base_chunker import BaseChunker
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter


class MarkdownChunker(BaseChunker):
    HEADERS_TO_SPLIT_ON = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]

    def __init__(self, chunk_size, chunk_overlap):
        self.markdown_splitter = MarkdownHeaderTextSplitter(
            self.HEADERS_TO_SPLIT_ON, strip_headers=False
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )

    def chunk(self, text):
        md_header_splits = self.markdown_splitter.split_text(text)
        result_text_splits = []
        for doc in md_header_splits:
            text_splits = self.text_splitter.split_text(doc.page_content)
            for text in text_splits:
                result_text_splits.append(text)
        return result_text_splits
