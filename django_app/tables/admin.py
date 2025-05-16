from django.contrib import admin
from .models import (
    Provider,
    LLMModel,
    EmbeddingModel,
    Tool,
    EnabledTools,
    Agent,
    Crew,
    Task,
)

admin.site.register(Provider)
admin.site.register(LLMModel)
admin.site.register(EmbeddingModel)
admin.site.register(Tool)
admin.site.register(EnabledTools)
admin.site.register(Agent)
admin.site.register(Crew)
admin.site.register(Task)
