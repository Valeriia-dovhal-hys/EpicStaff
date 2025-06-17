from django.core.management.base import BaseCommand
from tables.models import (
    Tool,
    ToolConfigField,
    EmbeddingModel,
    LLMModel,
    Provider,
    RealtimeModel,
    RealtimeTranscriptionModel,
)
from django.db import transaction
from tables.models.crew_models import Agent, DefaultAgentConfig, DefaultCrewConfig
from tables.models.embedding_models import DefaultEmbeddingConfig
from tables.models.llm_models import DefaultLLMConfig


class Command(BaseCommand):
    help = "Upload predefined models to database"

    def handle(self, *args, **kwargs):
        upload_providers()
        upload_llm_models()
        upload_realtime_agent_models()
        upload_realtime_transcription_models()
        upload_embedding_models()
        upload_tools()
        upload_default_llm_config()
        upload_default_embedding_config()
        upload_default_agent_config()
        upload_default_crew_config()

        upload_realtime_agents()


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

    llm_models = [
        {
            "name": "gpt-3.5-turbo",
            "llm_provider": openai_provider,
        },
        {
            "name": "gpt-4o",
            "llm_provider": openai_provider,
        },
        {
            "name": "gpt-4o-mini",
            "llm_provider": openai_provider,
        },
        {
            "name": "gpt-4-turbo-preview",
            "llm_provider": openai_provider,
        },
        {
            "name": "gpt-35-turbo-instruct",
            "llm_provider": azure_provider,
            "deployment": "gpt-35-turbo-instruct",
            "base_url": "https://yuriw-sweden.openai.azure.com/",
        },
        {
            "name": "gpt-4-1106-azure",
            "llm_provider": azure_provider,
            "base_url": "https://yuriw-sweden.openai.azure.com/",
        },
        {
            "name": "claude-3-opus-20240229",
            "llm_provider": anthropic_provider,
        },
        {
            "name": "llama3-70b-8192",
            "llm_provider": groq_provider,
        },
        {
            "name": "gemma-7b-it",
            "llm_provider": groq_provider,
        },
        {
            "name": "mixtral-8x7b-32768",
            "llm_provider": groq_provider,
        },
        {
            "name": "mixtral-8x7b-32768",
            "llm_provider": ollama_provider,
        },
    ]

    for model_data in llm_models:
        LLMModel.objects.get_or_create(
            predefined=True,
            name=model_data.get("name"),
            llm_provider=model_data.get("llm_provider"),
            base_url=model_data.get("base_url"),
            deployment=model_data.get("deployment"),
        )


def upload_realtime_agent_models():

    openai_provider = Provider.objects.get(name="openai")
    rt_models = [
        {
            "id": 1,
            "name": "gpt-4o-mini-realtime-preview-2024-12-17",
            "provider": openai_provider,
        },
        {
            "id": 2,
            "name": "gpt-4o-realtime-preview-2024-12-17",
            "provider": openai_provider,
        },
    ]

    for rt_model in rt_models:
        RealtimeModel.objects.update_or_create(
            id=rt_model.get("id"),
            name=rt_model.get("name"),
            provider_id=openai_provider.pk,
        )


def upload_realtime_transcription_models():

    openai_provider = Provider.objects.get(name="openai")
    rt_transcription_models = [
        {
            "id": 1,
            "name": "whisper-1",
            "provider": openai_provider,
        },
        {
            "id": 2,
            "name": "gpt-4o-mini-transcribe",
            "provider": openai_provider,
        },
        {
            "id": 3,
            "name": "gpt-4o-transcribe",
            "provider": openai_provider,
        },
    ]

    for model in rt_transcription_models:
        RealtimeTranscriptionModel.objects.update_or_create(
            id=model.get("id"),
            name=model.get("name"),
            provider_id=openai_provider.pk,
        )


def upload_embedding_models():
    openai_provider = Provider.objects.get(name="openai")
    azure_provider = Provider.objects.get(name="azure_openai")

    embedding_models = [
        {
            "name": "text-embedding-3-small",
            "embedding_provider": openai_provider,
        },
        {
            "name": "text-embedding-ada-002",
            "base_url": "https://yuriw-sweden.openai.azure.com/",
            "deployment": "text-embedding-ada-002",
            "embedding_provider": azure_provider,
        },
    ]

    for model_data in embedding_models:
        EmbeddingModel.objects.get_or_create(
            predefined=True,
            name=model_data.get("name"),
            embedding_provider=model_data.get("embedding_provider"),
            base_url=model_data.get("base_url"),
            deployment=model_data.get("deployment"),
        )


def upload_tools():
    tools = [
        {
            "name": "Wikipedia Tool",
            "name_alias": "wikipedia",
            "description": "Tool for Wikipedia searching",
        },
        {
            "name": "DuckDuckGo Search",
            "name_alias": "ddg_search",
            "description": "Tool for DuckDuckGo searching",
        },
        {
            "name": "Gmail Draft Creator",
            "name_alias": "create_draft",
            "description": "Tool for creating Gmail drafts",
            "enabled": False,
        },
        {
            "name": "Code Docs Search Tool",
            "name_alias": "code_docs_search",
            "description": "Tool for searching through code documentation",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "docs_url",
                    "description": "Specifies the URL of the code documentation to be searched.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "CSV Search Tool",
            "name_alias": "csv_search",
            "description": "Tool for searching within CSV files",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "csv",
                    "description": "The path to the CSV file you want to search. \
                        This is a mandatory argument if the tool was initialized without a specific CSV file; \
                        otherwise, it is optional.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "DALL-E Tool",
            "name_alias": "dalle",
            "description": "Tool for generating images with DALL-E",
            "fields": [
                {
                    "name": "model",
                    "description": "DALL-E model. Default = dall-e-3",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "size",
                    "description": "Picture size. Default = 1024x1024",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "quality",
                    "description": "Picture quality. Default = standard",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "n",
                    "description": "Number of pictures. Default = 1",
                    "data_type": ToolConfigField.FieldType.INTEGER,
                    "required": False,
                },
            ],
        },
        {
            "name": "Directory Read Tool",
            "name_alias": "directory_read",
            "description": "Tool for reading files in directories",
            "fields": [
                {
                    "name": "directory",
                    "description": "An argument that specifies the path to the directory whose contents you wish to list. \
                        It accepts both absolute and relative paths, guiding the tool to the desired directory for content listing.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "Directory Search Tool",
            "name_alias": "directory_search",
            "description": "Tool for searching within directories",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "directory",
                    "description": "A string argument that specifies the search directory. \
                        This is optional during initialization but required for searches if not set initially.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "DOCX Search Tool",
            "name_alias": "docx_search",
            "description": "Tool for searching within DOCX files",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "docx",
                    "description": "An argument that specifies the path to the DOCX file you want to search. \
                        If not provided during initialization, the tool allows for later specification of \
                            any DOCX file’s content path for searching.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "EXA Search Tool",
            "name_alias": "exa_search",
            "description": "Tool for EXA data searching",
            "enabled": False,
        },
        {
            "name": "File Read Tool",
            "name_alias": "file_read",
            "description": "Tool for reading files",
            "fields": [
                {
                    "name": "file_path",
                    "description": "The path to the file you want to read. \
                        It accepts both absolute and relative paths. \
                        Ensure the file exists and you have the necessary permissions to access it.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "File Writer Tool",
            "name_alias": "file_writer",
            "description": "Tool for writing files",
        },
        {
            "name": "GitHub Search Tool",
            "name_alias": "github_search",
            "description": "Tool for searching GitHub repositories",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "github_repo",
                    "description": "The URL of the GitHub repository where the search will be conducted. \
                        \nThis is a mandatory field and specifies the target repository for your search.\
                            Example: https://github.com/example/repo",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
                {
                    "name": "gh_token",
                    "description": "Your GitHub Personal Access Token (PAT) required for authentication.\
                        \nYou can create one in your GitHub account settings under Developer Settings > Personal Access Tokens.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
                {
                    "name": "content_types",
                    "description": "Specifies the types of content to include in your search. \
                        \nExample: ['code', 'repo', 'pr', 'issue']\
                        \nYou must provide a list of content types from the following options: \
                            \ncode for searching within the code, \
                            \nrepo for searching within the repository’s general information, \
                            \npr for searching within pull requests, and \
                            \nissue for searching within issues. \
                        This field is mandatory and allows tailoring the search to specific content types within the GitHub repository.",
                    "data_type": ToolConfigField.FieldType.ANY,
                    "required": True,
                },
            ],
        },
        {
            "name": "Serper.dev Tool",
            "name_alias": "serper_dev",
            "description": "Tool for Serper.dev search",
            "fields": [
                {
                    "name": "search_url",
                    "description": "The URL endpoint for the search API. \
                        (Default is https://google.serper.dev/search)",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "country",
                    "description": "Specify the country for the search results.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "location",
                    "description": "Specify the location for the search results.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "locale",
                    "description": "Specify the locale for the search results.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "n_results",
                    "description": "Number of search results to return. Default is 10.",
                    "data_type": ToolConfigField.FieldType.INTEGER,
                    "required": False,
                },
            ],
        },
        {
            "name": "JSON Search Tool",
            "name_alias": "json_search",
            "description": "Tool for searching JSON files",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "json_path",
                    "description": "Specifies the path to the JSON file to be searched. \
                        This argument is not required if the tool is initialized for a general search. \
                        When provided, it confines the search to the specified JSON file.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "MDX Search Tool",
            "name_alias": "mdx_search",
            "description": "Tool for searching MDX files",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "mdx",
                    "description": "Specifies the MDX file path for the search. It can be provided during initialization.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "MySQL Search Tool",
            "name_alias": "my_sql_search",
            "description": "Tool for searching MySQL databases",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "db_uri",
                    "description": "A string representing the URI of the MySQL database to be queried. \
                        This argument is mandatory and must include the necessary authentication details \
                            and the location of the database.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
                {
                    "name": "table_name",
                    "description": "A string specifying the name of the table within the database on which the semantic search will be performed. This argument is mandatory.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
            ],
        },
        {
            "name": "NL2SQL Tool",
            "name_alias": "nl2sql",
            "description": "Tool for natural language to SQL queries",
            "enabled": False,
            "fields": [
                {
                    "name": "db_uri",
                    "description": "The URI of the database to connect to.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
                {
                    "name": "tables",
                    "description": "List of database tables",
                    "data_type": ToolConfigField.FieldType.ANY,
                    "required": False,
                },
                {
                    "name": "columns",
                    "description": "dict of database columns",
                    "data_type": ToolConfigField.FieldType.ANY,
                    "required": False,
                },
            ],
        },
        {
            "name": "PDF Search Tool",
            "name_alias": "pdf_search",
            "description": "Tool for searching PDF documents",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "pdf",
                    "description": "The PDF path for the search. \
                        Can be provided at initialization or within run by agent. \
                        If provided at initialization, the tool confines its search to the specified document.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "PostgreSQL Search Tool",
            "name_alias": "pg_search",
            "description": "Tool for searching PostgreSQL databases",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "db_uri",
                    "description": "A string representing the URI of the PostgreSQL database to be queried. \
                        This argument will be mandatory and must include the necessary authentication details \
                            and the location of the database.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
                {
                    "name": "table_name",
                    "description": "A string specifying the name of the table within the database \
                        on which the semantic search will be performed.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
            ],
        },
        {
            "name": "Scrape Website Tool",
            "name_alias": "scrape_website",
            "description": "Tool for scraping websites",
            "fields": [
                {
                    "name": "website_url",
                    "description": "Website URL.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
            ],
        },
        {
            "name": "Selenium Scraping Tool",
            "name_alias": "selenium_scraping",
            "description": "Tool for scraping websites using Selenium",
            "enabled": False,
            "fields": [
                {
                    "name": "website_url",
                    "description": "Specifies the URL of the website from which content is to be scraped.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "css_element",
                    "description": "The CSS selector for a specific element to target on the website, \
                        enabling focused scraping of a particular part of a webpage.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "cookie",
                    "description": "A dictionary containing cookie information, \
                        useful for simulating a logged-in session to access restricted content.",
                    "data_type": ToolConfigField.FieldType.ANY,
                    "required": False,
                },
                {
                    "name": "wait_time",
                    "description": "Specifies the delay (in seconds) before scraping, \
                        allowing the website and any dynamic content to fully load.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "TXT Search Tool",
            "name_alias": "txt_search",
            "description": "Tool for searching TXT files",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "txt",
                    "description": "The path to the text file you want to search. \
                        This argument is only required if the tool was not initialized with a specific text file; \
                        otherwise, the search will be conducted within the initially provided text file.\
                        \nExample: path/to/text/file.txt",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "Vision Tool",
            "name_alias": "vision",
            "description": "Tool for image analysis",
        },
        {
            "name": "Website Search Tool",
            "name_alias": "website_search",
            "description": "Tool for searching websites",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "website",
                    "description": "An optional argument intended to specify the website URL for focused searches. \
                        This argument is designed to enhance the tool’s flexibility by allowing targeted searches when necessary.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "XML Search Tool",
            "name_alias": "xml_search",
            "description": "Tool for searching XML files",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "xml",
                    "description": "This is the path to the XML file you wish to search. \
                        It is an optional parameter during the tool’s initialization \
                        but must be provided either at initialization or as part of the run method’s arguments to execute a search.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": True,
                },
            ],
        },
        {
            "name": "YouTube Channel Search Tool",
            "name_alias": "youtube_channel_search",
            "description": "Tool for searching YouTube channels",
            "enabled": False,
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "youtube_channel_handle",
                    "description": "A mandatory string representing the Youtube channel handle. \
                        This parameter is crucial for initializing the tool to specify the channel you want to search within. \
                        The tool is designed to only search within the content of the provided channel handle.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "YouTube Video Search Tool",
            "name_alias": "youtube_video_search",
            "description": "Tool for searching YouTube videos",
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
                {
                    "name": "youtube_video_url",
                    "description": "An optional argument at initialization but required if targeting a specific Youtube video. \
                        It specifies the Youtube video URL path you want to search within.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "Firecrawl Crawl Website Tool",
            "name_alias": "firecrawl_crawl_website",
            "description": "Crawl and convert websites into clean markdown or structured data.",
            "fields": [
                {
                    "name": "api_key",
                    "description": "Specifies Firecrawl API key. \
                        Defaults is the FIRECRAWL_API_KEY environment variable.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "Firecrawl Scrape Website Tool",
            "name_alias": "firecrawl_scrape_website",
            "description": "Tool for scraping websites with Firecrawl",
            "fields": [
                {
                    "name": "api_key",
                    "description": "Specifies Firecrawl API key. \
                        Defaults is the FIRECRAWL_API_KEY environment variable.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "Firecrawl Search Tool",
            "name_alias": "firecrawl_search",
            "description": "Tool for searching with Firecrawl",
            "fields": [
                {
                    "name": "api_key",
                    "description": "Specifies Firecrawl API key. \
                        Defaults is the FIRECRAWL_API_KEY environment variable.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "Spider Scraper",
            "name_alias": "spider_scraper",
            "description": "Tool for web scraping with Spider",
            "fields": [
                {
                    "name": "api_key",
                    "description": "Specifies Spider API key. \
                        If not specified, it looks for SPIDER_API_KEY in environment variables.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
            ],
        },
        {
            "name": "Composio Tool",
            "name_alias": "composio",
            "description": "Tool for document composition with Composio",
            "enabled": False,
        },
        {
            "name": "Browserbase Load Tool",
            "name_alias": "browserbase_load",
            "description": "Tool for browser-based loading with Browserbase",
            "fields": [
                {
                    "name": "api_key",
                    "description": "Browserbase API key.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "project_id",
                    "description": "Browserbase Project ID.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "text_content",
                    "description": "Retrieve only text content. Default is False.",
                    "data_type": ToolConfigField.FieldType.BOOLEAN,
                    "required": False,
                },
                {
                    "name": "session_id",
                    "description": "Provide an existing Session ID.",
                    "data_type": ToolConfigField.FieldType.STRING,
                    "required": False,
                },
                {
                    "name": "proxy",
                    "description": "Enable/Disable Proxies. Default is False.",
                    "data_type": ToolConfigField.FieldType.BOOLEAN,
                    "required": False,
                },
            ],
        },
        {
            "name": "Wolfram Alpha Tool",
            "name_alias": "wolfram_alpha",
            "description": "Tool for querying Wolfram Alpha",
        },
        {
            "name": "Custom Create Draft Tool",
            "name_alias": "custom_create_draft",
            "description": "Tool for creating custom drafts",
            "enabled": False,
        },
        {
            "name": "Custom File Append Tool",
            "name_alias": "custom_file_append",
            "description": "Tool for appending content to files",
        },
        {
            "name": "Custom File Line Count Tool",
            "name_alias": "custom_file_count_lines",
            "description": "Tool for counting lines in a file",
        },
        {
            "name": "Custom File Create Tool",
            "name_alias": "custom_create_file",
            "description": "Tool for creating new files",
        },
        {
            "name": "Custom File Edit Tool",
            "name_alias": "custom_edit_file",
            "description": "Tool for editing files",
        },
        {
            "name": "Custom File Line Read Tool",
            "name_alias": "custom_line_read_file",
            "description": "Tool for reading specific lines from a file",
        },
        {
            "name": "Custom Folder Tool",
            "name_alias": "custom_folder_tool",
            "description": "Tool for managing folders",
        },
        {
            "name": "Custom CLI Tool",
            "name_alias": "custom_cli",
            "description": "Tool for executing custom CLI commands",
            "fields": [
                {
                    "name": "llm_config",
                    "description": "Field for LLM Configuration",
                    "data_type": ToolConfigField.FieldType.LLM_CONFIG,
                    "required": True,
                },
                {
                    "name": "embedding_config",
                    "description": "Field for Embedding Configuration",
                    "data_type": ToolConfigField.FieldType.EMBEDDING_CONFIG,
                    "required": True,
                },
            ],
        },
    ]

    for tool_data in tools:
        tool, created = Tool.objects.get_or_create(
            name_alias=tool_data["name_alias"],
            defaults={
                "name": tool_data["name"],
                "description": tool_data["description"],
                "enabled": tool_data.get("enabled", True),
            },
        )

        if not created:  # If existed
            tool.name = tool_data["name"]
            tool.description = tool_data["description"]
            tool.save(update_fields=["name", "description"])

        field_list = tool_data.get("fields", list())

        # removing fields that not in schema
        ToolConfigField.objects.filter(tool=tool).exclude(
            name__in={field["name"] for field in field_list}
        ).delete()

        for field in field_list:
            ToolConfigField.objects.update_or_create(
                tool=tool,
                name=field["name"],
                defaults={
                    "description": field["description"],
                    "data_type": field["data_type"],
                    "required": field["required"],
                },
            )


def upload_realtime_agents():
    from tables.models.realtime_models import RealtimeAgent

    agent_list = Agent.objects.all()
    for agent in agent_list:
        RealtimeAgent.objects.get_or_create(
            agent=agent,
            defaults ={
                "distance_threshold":0.65,
                "search_limit":3,
                "wake_word":None,
                "stop_prompt":None,
                "language":None,
            }
        )

    pass


@transaction.atomic
def upload_default_llm_config():

    DefaultLLMConfig.objects.filter().delete()
    DefaultLLMConfig.objects.create(id=1)


@transaction.atomic
def upload_default_embedding_config():
    DefaultEmbeddingConfig.objects.filter().delete()
    DefaultEmbeddingConfig.objects.create(id=1)


@transaction.non_atomic_requests
def upload_default_agent_config():
    DefaultAgentConfig.objects.filter().delete()
    DefaultAgentConfig.objects.create(id=1)


@transaction.non_atomic_requests
def upload_default_crew_config():
    DefaultCrewConfig.objects.filter().delete()
    DefaultCrewConfig.objects.create(id=1)
