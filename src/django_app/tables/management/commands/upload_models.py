from django.core.management.base import BaseCommand
from tables.models import Provider, LLMModel, EmbeddingModel, Tool


class Command(BaseCommand):
    help = "Upload predifined models to database"

    def handle(self, *args, **kwargs):
        upload_providers()
        upload_llm_models()
        upload_embedding_models()
        upload_tools()


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


def upload_tools():
    tools = [
        {
            "name": "Wikipedia Tool",
            "name_alias": "wikipedia",
            "description": "Tool for Wikipedia searching",
            "requires_model": False,
        },
        {
            "name": "DuckDuckGo Search",
            "name_alias": "ddg_search",
            "description": "Tool for DuckDuckGo searching",
            "requires_model": False,
        },
        {
            "name": "Gmail Draft Creator",
            "name_alias": "create_draft",
            "description": "Tool for creating Gmail drafts",
            "requires_model": False,
        },
        {
            "name": "Code Docs Search Tool",
            "name_alias": "code_docs_search",
            "description": "Tool for searching through code documentation",
            "requires_model": True,
        },
        {
            "name": "CSV Search Tool",
            "name_alias": "csv_search",
            "description": "Tool for searching within CSV files",
            "requires_model": True,
        },
        {
            "name": "DALL-E Tool",
            "name_alias": "dalle",
            "description": "Tool for generating images with DALL-E",
            "requires_model": False,
        },
        {
            "name": "Directory Read Tool",
            "name_alias": "directory_read",
            "description": "Tool for reading files in directories",
            "requires_model": True,
        },
        {
            "name": "Directory Search Tool",
            "name_alias": "directory_search",
            "description": "Tool for searching within directories",
            "requires_model": False,
        },
        {
            "name": "DOCX Search Tool",
            "name_alias": "docx_search",
            "description": "Tool for searching within DOCX files",
            "requires_model": True,
        },
        {
            "name": "EXA Search Tool",
            "name_alias": "exa_search",
            "description": "Tool for EXA data searching",
            "requires_model": False,
        },
        {
            "name": "File Read Tool",
            "name_alias": "file_read",
            "description": "Tool for reading files",
            "requires_model": False,
        },
        {
            "name": "File Writer Tool",
            "name_alias": "file_writer",
            "description": "Tool for writing files",
            "requires_model": False,
        },
        {
            "name": "GitHub Search Tool",
            "name_alias": "github_search",
            "description": "Tool for searching GitHub repositories",
            "requires_model": True,
        },
        {
            "name": "Serper.dev Tool",
            "name_alias": "serper_dev",
            "description": "Tool for Serper.dev search",
            "requires_model": False,
        },
        {
            "name": "JSON Search Tool",
            "name_alias": "json_search",
            "description": "Tool for searching JSON files",
            "requires_model": True,
        },
        {
            "name": "MDX Search Tool",
            "name_alias": "mdx_search",
            "description": "Tool for searching MDX files",
            "requires_model": True,
        },
        {
            "name": "MySQL Search Tool",
            "name_alias": "my_sql_search",
            "description": "Tool for searching MySQL databases",
            "requires_model": True,
        },
        {
            "name": "NL2SQL Tool",
            "name_alias": "nl2sql",
            "description": "Tool for natural language to SQL queries",
            "requires_model": False,
        },
        {
            "name": "PDF Search Tool",
            "name_alias": "pdf_search",
            "description": "Tool for searching PDF documents",
            "requires_model": True,
        },
        {
            "name": "PostgreSQL Search Tool",
            "name_alias": "pg_search",
            "description": "Tool for searching PostgreSQL databases",
            "requires_model": True,
        },
        {
            "name": "Scrape Website Tool",
            "name_alias": "scrape_website",
            "description": "Tool for scraping websites",
            "requires_model": False,
        },
        {
            "name": "Selenium Scraping Tool",
            "name_alias": "selenium_scraping",
            "description": "Tool for scraping websites using Selenium",
            "requires_model": False,
        },
        {
            "name": "TXT Search Tool",
            "name_alias": "txt_search",
            "description": "Tool for searching TXT files",
            "requires_model": True,
        },
        {
            "name": "Vision Tool",
            "name_alias": "vision",
            "description": "Tool for image analysis",
            "requires_model": False,
        },
        {
            "name": "Website Search Tool",
            "name_alias": "website_search",
            "description": "Tool for searching websites",
            "requires_model": True,
        },
        {
            "name": "XML Search Tool",
            "name_alias": "xml_search",
            "description": "Tool for searching XML files",
            "requires_model": True,
        },
        {
            "name": "YouTube Channel Search Tool",
            "name_alias": "youtube_channel_search",
            "description": "Tool for searching YouTube channels",
            "requires_model": True,
        },
        {
            "name": "YouTube Video Search Tool",
            "name_alias": "youtube_video_search",
            "description": "Tool for searching YouTube videos",
            "requires_model": True,
        },
        {
            "name": "Firecrawl Scrape Website Tool",
            "name_alias": "firecrawl_scrape_website",
            "description": "Tool for scraping websites with Firecrawl",
            "requires_model": False,
        },
        {
            "name": "Firecrawl Search Tool",
            "name_alias": "firecrawl_search",
            "description": "Tool for searching with Firecrawl",
            "requires_model": False,
        },
        {
            "name": "Spider Tool",
            "name_alias": "spider_scraper",
            "description": "Tool for web scraping with Spider",
            "requires_model": False,
        },
        {
            "name": "Composio Tool",
            "name_alias": "composio",
            "description": "Tool for document composition with Composio",
            "requires_model": False,
        },
        {
            "name": "Browserbase Load Tool",
            "name_alias": "browserbase_load",
            "description": "Tool for browser-based loading with Browserbase",
            "requires_model": False,
        },
        {
            "name": "Wolfram Alpha Tool",
            "name_alias": "wolfram_alpha",
            "description": "Tool for querying Wolfram Alpha",
            "requires_model": False,
        }
    ]
    
    for tool_data in tools:
        Tool.objects.get_or_create(**tool_data)

