from django.core.management.base import BaseCommand
from tables.models import *


class Command(BaseCommand):
    help = "Upload predifined models to database"

    def handle(self, *args, **kwargs):
        upload_providers()
        upload_llm_models()
        upload_embedding_models()


def upload_providers():
    provider_names = {
        "anthropic",
        "azure_openai",
        "groq",
        "huggingface",
        "ollama",
        "openai",
        "openai_compatible",
    }

    for name in provider_names:
        Provider.objects.get_or_create(name=name)


def upload_llm_models():
    openai_provider = Provider.objects.get(name="openai")
    azure_provider = Provider.objects.get(name="azure_openai")
    anthropic_provider = Provider.objects.get(name="anthropic")
    groq_provider = Provider.objects.get(name="groq")
    ollama_provider = Provider.objects.get(name="ollama")

    LLMModel.objects.get_or_create(
        name="gpt-3.5-turbo",
        llm_provider=openai_provider,
    )
    LLMModel.objects.get_or_create(
        name="gpt-4o",
        llm_provider=openai_provider,
    )
    LLMModel.objects.get_or_create(
        name="gpt-4-turbo-preview",
        llm_provider=openai_provider,
    )
    LLMModel.objects.get_or_create(
        name="gpt-35-turbo-instruct",
        llm_provider=azure_provider,
        deployment="gpt-35-turbo-instruct",
        base_url="https://yuriw-sweden.openai.azure.com/",
    )
    LLMModel.objects.get_or_create(
        name="gpt-4-1106-azure",
        llm_provider=azure_provider,
        deployment="gpt-4-1106-azure",
        base_url="https://yuriw-sweden.openai.azure.com/",
    )
    LLMModel.objects.get_or_create(
        name="gpt-4-1106-azure",
        llm_provider=azure_provider,
        base_url="https://yuriw-sweden.openai.azure.com/",
    )

    LLMModel.objects.get_or_create(
        name="claude-3-opus-20240229",
        llm_provider=anthropic_provider,
    )

    LLMModel.objects.get_or_create(
        name="llama3-70b-8192",
        llm_provider=groq_provider,
    )

    LLMModel.objects.get_or_create(
        name="gemma-7b-it",
        llm_provider=groq_provider,
    )
    LLMModel.objects.get_or_create(
        name="mixtral-8x7b-32768",
        llm_provider=groq_provider,
    )

    LLMModel.objects.get_or_create(
        name="mixtral-8x7b-32768",
        llm_provider=ollama_provider,
    )


def upload_embedding_models():
    openai_provider = Provider.objects.get(name="openai")
    azure_provider = Provider.objects.get(name="azure_openai")

    EmbeddingModel.objects.get_or_create(
        name="text-embedding-3-small",
        embedding_provider=openai_provider,
    )
    EmbeddingModel.objects.get_or_create(
        name="text-embedding-ada-002",
        embedding_provider=azure_provider,
        base_url="https://yuriw-sweden.openai.azure.com/",
        deployment="text-embedding-ada-002",
    )
