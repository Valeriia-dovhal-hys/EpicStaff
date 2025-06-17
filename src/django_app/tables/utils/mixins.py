from rest_framework import serializers
from tables.models import DocumentMetadata, DocumentContent
from .file_text_extractor import extract_text_from_file

ALLOWED_FILE_TYPES = {choice[0] for choice in DocumentMetadata.DocumentFileType.choices}
MAX_FILE_SIZE = 12 * 1024 * 1024  # 12MB


class SourceSerializerMixin:
    """
    Mixin for validating file fields by size and file type(extension),
    validation of equal lenght of lists (files, chunk_sizes, chunk_strategies, chunk_overlaps)
    and creating DocumentMetadata and DocumentContent.
    """

    def validate_files_list(self, files):
        errors = {}
        for idx, uploaded_file in enumerate(files):
            file_errors = []
            if uploaded_file.size > MAX_FILE_SIZE:
                file_errors.append(f"{uploaded_file.name} exceeds 12MB limit.")
            ext = uploaded_file.name.split(".")[-1].lower()
            if ext not in ALLOWED_FILE_TYPES:
                file_errors.append(
                    f"{uploaded_file.name} has an invalid file type. Allowed types: {', '.join(ALLOWED_FILE_TYPES)}."
                )
            if file_errors:
                errors[f"files[{idx}]"] = file_errors
        if errors:
            raise serializers.ValidationError(errors)
        return files

    def validate_list_lengths(self, attrs):
        files = attrs.get("files")
        chunk_sizes = attrs.get("chunk_sizes")
        chunk_strategies = attrs.get("chunk_strategies")
        chunk_overlaps = attrs.get("chunk_overlaps")

        list_lengths = {
            "files": len(files),
            "chunk_sizes": len(chunk_sizes),
            "chunk_strategies": len(chunk_strategies),
            "chunk_overlaps": len(chunk_overlaps),
        }

        if len(set(list_lengths.values())) != 1:
            raise serializers.ValidationError(
                f"All list fields must have the same length. Received lengths: {list_lengths}"
            )

        return attrs

    def create_documents_for_collection(
        self, collection, files, chunk_sizes, chunk_strategies, chunk_overlaps
    ):
        for uploaded_file, chunk_size, chunk_strategy, chunk_overlap in zip(
            files, chunk_sizes, chunk_strategies, chunk_overlaps
        ):
            file_type = uploaded_file.name.split(".")[-1].lower()
            doc_meta = DocumentMetadata.objects.create(
                file_name=uploaded_file.name,
                file_type=file_type,
                source_collection=collection,
                chunk_size=chunk_size,
                chunk_strategy=chunk_strategy,
                chunk_overlap=chunk_overlap,
            )

            # TODO: Potential bug here: text extraction can take a long time.
            # Solution: save file in storage as is (without converting to binary data)
            # and than extract text / process images in knowledge container.
            extracted_text = extract_text_from_file(uploaded_file, file_type)

            DocumentContent.objects.create(
                document_metadata=doc_meta, content=extracted_text.encode("utf-8")
            )
        return None
