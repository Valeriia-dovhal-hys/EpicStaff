from crewai import LLM

from models.request_models import LLMData


def parse_llm(llm: LLMData):
    llm_config = {**llm.config.model_dump()}
    llm_config["model"] = (
        f"{llm.provider}/{llm_config["model"]}"  # ! litellm taking provider this way
    )

    return LLM(**llm_config)