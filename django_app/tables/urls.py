from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TemplateAgentViewSet,
    ConfigLLMViewSet,
    ProviderViewSet,
    LLMModelViewSet,
    EmbeddingModelViewSet,
    ManagerLLMModelViewSet,
    ToolViewSet,
    EnabledToolsViewSet,
    AgentViewSet,
    CrewViewSet,
    TaskViewSet,
    RunCrew,
)

router = DefaultRouter()
router.register(r"template-agents", TemplateAgentViewSet)
router.register(r"config-llm", ConfigLLMViewSet)
router.register(r"providers", ProviderViewSet)
router.register(r"llm-models", LLMModelViewSet)
router.register(r"embedding-models", EmbeddingModelViewSet)
router.register(r"manager-llm-models", ManagerLLMModelViewSet)
router.register(r"tools", ToolViewSet)
router.register(r"enabled-tools", EnabledToolsViewSet)
router.register(r"agents", AgentViewSet)
router.register(r"crews", CrewViewSet)
router.register(r"tasks", TaskViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("run-crew/", RunCrew.as_view(), name="run-crew"),
]
