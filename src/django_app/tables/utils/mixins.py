from rest_framework import serializers
from tables.models import DocumentMetadata, DocumentContent
from .file_text_extractor import extract_text_from_file
from loguru import logger
import json
import re

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

    def validate_list_document_metadata(self, list_document_metadata: list):
        errors = []
        for document_metadata in list_document_metadata:
            if not isinstance(document_metadata["document_content"], DocumentContent):
                errors.append(
                    f'The source file "{document_metadata["file_name"]}" to create a copy does not exist.'
                )

        if errors:
            raise serializers.ValidationError(errors)

    def _validate_jsons(self, list_of_objects: list) -> None:
        errors = []
        for obj in list_of_objects:
            try:
                self._validate_json(obj)
            except Exception as e:
                errors.append(e)
        if errors:
            raise serializers.ValidationError(errors)

    def _validate_json(self, obj) -> None:
        if not isinstance(obj, dict):
            raise serializers.ValidationError(f"Trying to pass invalid json: {obj}")

    def _convert_list_str_to_json(
        self, list_of_objects: list[str | dict]
    ) -> list[dict]:
        result = []

        for obj in list_of_objects:
            result.append(self._convert_str_to_json(obj))

        return result

    def _convert_str_to_json(self, obj) -> dict:
        if isinstance(obj, str):
            try:
                return json.loads(obj)
            except Exception as e:
                try:
                    safe_obj = re.sub(r"\\", r"\\\\", obj)
                    return json.loads(safe_obj)
                except Exception as e:
                    logger.error(f"Exception in '_convert_str_to_json': {e}")
                    return obj
        else:
            return obj

    def create_documents_for_collection(
        self,
        collection,
        files,
        chunk_sizes,
        chunk_strategies,
        chunk_overlaps,
        raw_additional_params,
    ):
        additional_params = self._convert_list_str_to_json(raw_additional_params)
        self._validate_jsons(additional_params)
        for (
            uploaded_file,
            chunk_size,
            chunk_strategy,
            chunk_overlap,
            additional_param,
        ) in zip(
            files, chunk_sizes, chunk_strategies, chunk_overlaps, additional_params
        ):
            file_type = uploaded_file.name.split(".")[-1].lower()
            extracted_text = extract_text_from_file(uploaded_file, file_type)
            document_content = DocumentContent.objects.create(
                content=extracted_text.encode("utf-8")
            )

            DocumentMetadata.objects.create(
                file_name=uploaded_file.name,
                file_type=file_type,
                source_collection=collection,
                chunk_size=chunk_size,
                chunk_strategy=chunk_strategy,
                chunk_overlap=chunk_overlap,
                additional_params=additional_param,
                document_content=document_content,
            )

            # TODO: Potential bug here: text extraction can take a long time.
            # Solution: save file in storage as is (without converting to binary data)
            # and than extract text / process images in knowledge container.

        return None

    def create_copy_collection(self, collection, list_document_metadata: list):
        self.validate_list_document_metadata(
            list_document_metadata=list_document_metadata
        )
        for document_metadata in list_document_metadata:

            additional_params = self._convert_str_to_json(
                document_metadata["additional_params"]
            )
            self._validate_json(additional_params)

            DocumentMetadata.objects.create(
                file_name=document_metadata["file_name"],
                file_type=document_metadata["file_type"],
                source_collection=collection,
                chunk_size=document_metadata["chunk_size"],
                chunk_strategy=document_metadata["chunk_strategy"],
                chunk_overlap=document_metadata["chunk_overlap"],
                additional_params=additional_params,
                document_content=document_metadata["document_content"],
            )

        return None
