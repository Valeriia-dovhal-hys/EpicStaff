from django.utils import timezone
from django.db import models

from tables.models import (
    CrewSessionMessage,
)


class Session(models.Model):
    class SessionStatus(models.TextChoices):
        END = "end"
        RUN = "run"
        WAIT_FOR_USER = "wait_for_user"
        ERROR = "error"
        PENDING = "pending"

    graph = models.ForeignKey("Graph", on_delete=models.CASCADE, null=True)
    status = models.CharField(
        choices=SessionStatus.choices, max_length=255, blank=False, null=False
    )
    status_data = models.JSONField(default=dict)
    variables = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True)
    graph_schema = models.JSONField(default=dict)

    def save(self, *args, **kwargs):
        if (
            self.status in {self.SessionStatus.END, self.SessionStatus.ERROR}
            and not self.finished_at
        ):
            self.finished_at = timezone.now()

        super().save(*args, **kwargs)

    class Meta:
        get_latest_by = ["id"]


class UserSessionMessage(CrewSessionMessage):

    text = models.TextField()


class AgentSessionMessage(CrewSessionMessage):
    agent = models.ForeignKey(
        "Agent", on_delete=models.SET_NULL, null=True, default=None
    )
    thought = models.TextField(blank=True, default="")
    tool = models.TextField(blank=True, default=None, null=True)
    tool_input = models.TextField(blank=True, default=None, null=True)
    text = models.TextField(blank=True, default="")
    result = models.TextField(blank=True, default="")


class TaskSessionMessage(CrewSessionMessage):
    task = models.ForeignKey("Task", on_delete=models.SET_NULL, null=True, default=None)
    description = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    expected_output = models.TextField(blank=True, default="")
    raw = models.TextField(blank=True, default="")
    agent = models.TextField(blank=True, default="")
