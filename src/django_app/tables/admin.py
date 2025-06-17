from django.contrib import admin
from .models import Agent, Tool, ToolConfig, ToolConfigField
from .models import LLMConfig
from .models import EmbeddingModel
from .models import Provider
from .models import LLMModel
from .models import Crew
from .models import (
    Task,
)

admin.site.register(Provider)
admin.site.register(LLMModel)
admin.site.register(EmbeddingModel)
admin.site.register(Tool)
admin.site.register(Agent)
admin.site.register(Crew)
admin.site.register(Task)
admin.site.register(LLMConfig)
admin.site.register(ToolConfigField)
admin.site.register(ToolConfig)
