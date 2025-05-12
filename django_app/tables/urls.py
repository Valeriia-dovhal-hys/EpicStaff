from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .model_views import (
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
)
from .views import (
    AnswerToLLM,
    SessionMessageListView,
    SessionViewSet,
    RunCrew,
    GetUpdates,
    StopSession,
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
router.register(r"sessions", SessionViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("run-crew/", RunCrew.as_view(), name="run-crew"),
    path("answer-to-llm/", AnswerToLLM.as_view(), name="answer-to-llm"),
    path(
        "sessions/<int:session_id>/get-updates/",
        GetUpdates.as_view(),
        name="get-updates",
    ),
    path("sessions/<int:session_id>/stop", StopSession.as_view(), name="stop-session"),
    path(
        "sessions/<int:session_id>/messages",
        SessionMessageListView.as_view(),
        name="messages",
    ),
]
