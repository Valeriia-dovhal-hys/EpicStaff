from chunkers.base_chunker import BaseChunker
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_text_splitters import HTMLSectionSplitter


class HTMLChunker(BaseChunker):
    HEADERS_TO_SPLIT_ON = [
        ("h1", "Header 1"),
        ("h2", "Header 2"),
        ("h3", "Header 3"),
    ]

    def __init__(self, chunk_size, chunk_overlap):
        """
        Initialize the chunker with the provided chunk size and overlap.
        Uses RecursiveCharacterTextSplitter to split the text.
        """
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        self.html_splitter = HTMLSectionSplitter(self.HEADERS_TO_SPLIT_ON)

    def chunk(self, html_text):
        html_header_splits = self.html_splitter.split_text(html_text)
        result_text_splits = []
        for doc in html_header_splits:
            text_splits = self.text_splitter.split_text(doc.page_content)
            for text in text_splits:
                result_text_splits.append(text)
        return result_text_splits
