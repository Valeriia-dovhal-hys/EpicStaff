from django.urls import path, include
from rest_framework.routers import DefaultRouter

from tables.views.model_view_sets import (
    TemplateAgentReadWriteViewSet,
    ConfigLLMReadWriteViewSet,
    ProviderReadWriteViewSet,
    LLMModelReadWriteViewSet,
    EmbeddingModelReadWriteViewSet,
    ToolReadWriteViewSet,
    AgentReadWriteViewSet,
    CrewReadWriteViewSet,
    TaskReadWriteViewSet,
)


from .views.views import (
    AnswerToLLM,
    EnviromentConfig,
    SessionMessageListView,
    SessionViewSet,
    RunCrew,
    GetUpdates,
    StopSession,
    delete_environment_config,
    getToolAliases,
)

router = DefaultRouter()
router.register(r"template-agents", TemplateAgentReadWriteViewSet)


router.register(r"config-llm", ConfigLLMReadWriteViewSet)
router.register(r"providers", ProviderReadWriteViewSet)
router.register(r"llm-models", LLMModelReadWriteViewSet)
router.register(r"embedding-models", EmbeddingModelReadWriteViewSet)
router.register(r"tools", ToolReadWriteViewSet)
router.register(r"agents", AgentReadWriteViewSet)
router.register(r"crews", CrewReadWriteViewSet)
router.register(r"tasks", TaskReadWriteViewSet)


router.register(r"sessions", SessionViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("run-crew/", RunCrew.as_view(), name="run-crew"),
    path("tool-aliases/", getToolAliases, name="tool-aliases"),
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
    path(
        "environment/config",
        EnviromentConfig.as_view(),
        name="enviroment_config",
    ),
    path(
        "environment/config/<str:key>/",
        delete_environment_config,
        name="delete_enviroment_config",
    ),
]
