from django.db import models
from tables.models import (
    DefaultBaseModel,
    Provider,
    AbstractDefaultFillableModel,
)


class LLMModel(models.Model):

    name = models.TextField()
    predefined = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    llm_provider = models.ForeignKey(Provider, on_delete=models.SET_NULL, null=True)
    base_url = models.URLField(null=True, blank=True)
    deployment = models.TextField(null=True, blank=True)
    is_visible = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class DefaultLLMConfig(DefaultBaseModel):

    model = models.ForeignKey(LLMModel, on_delete=models.SET_NULL, null=True)
    temperature = models.FloatField(default=0.7, null=True, blank=True)
    top_p = models.FloatField(null=True, blank=True)
    n = models.IntegerField(null=True, blank=True)
    stop = models.JSONField(null=True, blank=True)
    max_completion_tokens = models.IntegerField(null=True, blank=True)
    max_tokens = models.IntegerField(default=4096, null=True, blank=True)
    presence_penalty = models.FloatField(null=True, blank=True)
    frequency_penalty = models.FloatField(null=True, blank=True)
    logit_bias = models.JSONField(null=True, blank=True)
    response_format = models.JSONField(null=True, blank=True)
    seed = models.IntegerField(null=True, blank=True)
    logprobs = models.BooleanField(null=True, blank=True)
    top_logprobs = models.IntegerField(null=True, blank=True)
    base_url = models.URLField(null=True, blank=True)
    api_version = models.TextField(null=True, blank=True)
    api_key = models.TextField(null=True, blank=True)
    timeout = models.FloatField(null=True, blank=True)
    is_visible = models.BooleanField(default=True)


class LLMConfig(AbstractDefaultFillableModel):
    custom_name = models.TextField(unique=True)
    model = models.ForeignKey(LLMModel, on_delete=models.PROTECT, null=True)
    temperature = models.FloatField(default=0.7, null=True, blank=True)
    top_p = models.FloatField(null=True, blank=True)
    n = models.IntegerField(null=True, blank=True)
    stop = models.JSONField(null=True, blank=True)
    max_completion_tokens = models.IntegerField(null=True, blank=True)
    max_tokens = models.IntegerField(default=None, null=True, blank=True)
    presence_penalty = models.FloatField(null=True, blank=True)
    frequency_penalty = models.FloatField(null=True, blank=True)
    logit_bias = models.JSONField(null=True, blank=True)
    response_format = models.JSONField(null=True, blank=True)
    seed = models.IntegerField(null=True, blank=True)
    logprobs = models.BooleanField(null=True, blank=True)
    top_logprobs = models.IntegerField(null=True, blank=True)
    base_url = models.URLField(null=True, blank=True)
    api_version = models.TextField(null=True, blank=True)
    api_key = models.TextField(null=True, blank=True)
    timeout = models.FloatField(null=True, blank=True)
    is_visible = models.BooleanField(default=True)

    def get_default_model(self):
        return DefaultLLMConfig.load()

    def delete(self, *args, **kwargs):
        from tables.models import set_field_value_null_in_tool_configs
        from tables.models import ToolConfigField

        llm_config_id = self.pk
        super().delete(*args, **kwargs)

        set_field_value_null_in_tool_configs(
            field_type=ToolConfigField.FieldType.LLM_CONFIG, value=llm_config_id
        )


class RealtimeModel(models.Model):
    name = models.CharField(
        max_length=250, default="gpt-4o-mini-realtime-preview-2024-12-17"
    )
    provider = models.ForeignKey(
        "Provider", on_delete=models.CASCADE, null=True, default=None
    )


class RealtimeConfig(models.Model):
    custom_name = models.CharField(max_length=250)
    realtime_model = models.ForeignKey("RealtimeModel", on_delete=models.CASCADE)
    api_key = models.TextField()


class RealtimeTranscriptionModel(models.Model):
    name = models.CharField(max_length=250, default="whisper-1")
    provider = models.ForeignKey(
        "Provider", on_delete=models.CASCADE, null=True, default=None
    )


class RealtimeTranscriptionConfig(models.Model):
    custom_name = models.CharField(max_length=250)
    realtime_transcription_model = models.ForeignKey(
        "RealtimeTranscriptionModel", on_delete=models.CASCADE
    )
    api_key = models.TextField()
