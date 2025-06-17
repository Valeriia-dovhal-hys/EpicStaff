from typing import List
from loguru import logger


def extract_knowledge_context(knowledge_snippets: List[str]) -> str:
    """Extract knowledge from the task prompt."""
    snippet = "\n\n".join(knowledge_snippets)

    logger.info(f"KNOWLEDGES: {(snippet[:150]).strip()}...")

    # DONT CHANGE KNOWLEDGE_KEYWORD it uses in src\crew\crew_venv\Lib\site-packages\crewai\agents\crew_agent_executor.py
    KNOWLEDGE_KEYWORD = "\nUse this information for answer:"
    return f'{KNOWLEDGE_KEYWORD} \n\n"{snippet}"' if knowledge_snippets else ""
