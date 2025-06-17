from django.utils import timezone
from typing import Any
from django.db import models

from tables.models import DefaultBaseModel, AbstractDefaultFillableModel


class VoiceChoices(models.TextChoices):
    ALLOY = "alloy", "Alloy"
    AHS = "ash", "Ash"
    BALLAD = "ballad", "Ballad"
    CORAL = "coral", "Coral"
    ECHO = "echo", "Echo"
    FABLE = "fable", "Fable"
    ONYX = "onyx", "Onyx"
    NOVA = "nova", "Nova"
    SAGE = "sage", "Sage"
    SHIMMER = "shimmer", "Shimmer"
    VERSE = "verse", "Verse"

# AbstractDefaultFillableModel
class RealtimeAgent(AbstractDefaultFillableModel):
    class Meta:
        db_table = "realtime_agent"

    agent = models.OneToOneField(
        "Agent",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="realtime_agent",
    )

    search_limit = models.PositiveIntegerField(
        default=3, blank=True, help_text="Integer between 0 and 1000 for knowledge"
    )

    distance_threshold = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.65,
        blank=True,
        help_text="Float between 0.00 and 1.00 for knowledge",
    )
    wake_word = models.CharField(max_length=255, null=True, blank=True)
    stop_prompt = models.CharField(
        default="stop", max_length=255, null=True, blank=True
    )
    language = models.CharField(
        max_length=2, null=True, blank=True, help_text="ISO-639-1 format"
    )
    voice_recognition_prompt = models.TextField(
        null=True,
        blank=True,
        help_text="The prompt to use for the transcription, to guide the model (e.g. 'Expect words related to technology')",
    )
    voice = models.CharField(
        max_length=20, choices=VoiceChoices.choices, default=VoiceChoices.ALLOY
    )
    realtime_config = models.ForeignKey(
        "RealtimeConfig", on_delete=models.SET_NULL, null=True, default=None
    )
    realtime_transcription_config = models.ForeignKey(
        "RealtimeTranscriptionConfig",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )

    def save(self, *args, **kwargs):
        if self.wake_word is None:
            if self.agent.role is not None:
                self.wake_word = self.agent.role
            else:
                self.wake_word = "agent"

        super().save(*args, **kwargs)

    def get_default_model(self):
        return DefaultRealtimeAgentConfig.load()


class RealtimeAgentChat(models.Model):
    class Meta:
        db_table = "realtime_agent_chat"

    rt_agent = models.ForeignKey(
        "RealtimeAgent",
        on_delete=models.SET_NULL,
        null=True,
    )
    search_limit = models.PositiveIntegerField(
        default=3, blank=True, help_text="Integer between 0 and 1000 for knowledge"
    )

    distance_threshold = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.65,
        blank=True,
        help_text="Float between 0.00 and 1.00 for knowledge",
    )
    connection_key = models.TextField()
    wake_word = models.CharField(max_length=255, null=True, blank=True)
    stop_prompt = models.CharField(
        default="stop", max_length=255, null=True, blank=True
    )
    language = models.CharField(
        max_length=2, null=True, blank=True, help_text="ISO-639-1 format"
    )
    voice_recognition_prompt = models.TextField(
        null=True,
        blank=True,
        help_text="The prompt to use for the transcription, to guide the model (e.g. 'Expect words related to technology')",
    )
    voice = models.CharField(
        max_length=20, choices=VoiceChoices.choices, default=VoiceChoices.ALLOY
    )
    realtime_config = models.ForeignKey(
        "RealtimeConfig", on_delete=models.SET_NULL, null=True, default=None
    )
    realtime_transcription_config = models.ForeignKey(
        "RealtimeTranscriptionConfig",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )
    created_at = models.DateTimeField(default=timezone.now)


class RealtimeSessionItem(models.Model):
    class Meta:
        db_table = "realtime_session_items"

    connection_key = models.TextField()
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class DefaultRealtimeAgentConfig(DefaultBaseModel):
    class Meta:
        db_table = "default_realtime_agent_config"

    search_limit = models.PositiveIntegerField(
        default=3, blank=True, help_text="Integer between 0 and 1000 for knowledge"
    )
    distance_threshold = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.65,
        blank=True,
        help_text="Float between 0.00 and 1.00 for knowledge",
    )
    wake_word = models.CharField(max_length=255, null=True, blank=True)
    stop_prompt = models.CharField(
        default="stop", max_length=255, null=True, blank=True
    )
    language = models.CharField(
        max_length=2, null=True, blank=True, help_text="ISO-639-1 format"
    )
    voice_recognition_prompt = models.TextField(
        null=True,
        blank=True,
        help_text="The prompt to use for the transcription, to guide the model (e.g. 'Expect words related to technology')",
    )
    voice = models.CharField(
        max_length=20, choices=VoiceChoices.choices, default=VoiceChoices.ALLOY
    )
    realtime_config = models.ForeignKey(
        "RealtimeConfig", on_delete=models.SET_NULL, null=True, default=None
    )
    realtime_transcription_config = models.ForeignKey(
        "RealtimeTranscriptionConfig",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )

    def __str__(self):
        return "Default Realtime Agent Config"
