from enum import Enum


class Status(Enum):
    """
    Statuses for DocumentMetadata and SourceCollection models
    """

    NEW = "new"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
