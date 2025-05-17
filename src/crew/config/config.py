import logging

logger = logging.getLogger(__name__)



class OllamaConfig:
    # patch_stop_words = True
    # patch_num_ctx = True
    stop_words = []


class HuggingFaceConfig:
    stop_sequences = ["\nObservation"]


class GroqConfig:
    max_tokens = 1000
    stop = []

    def get_rate_limit(model_name: str):
        model_rate_dict = {
            "llama2-70b-4096": 15000,
            "mixtral-8x7b-32768": 9000,
            "gemma-7b-it": 15000,
            "llama3-70b-8192": 5000,
            "llama3-8b-8192": 12000,
        }
        if model_name in model_rate_dict:
            return model_rate_dict[model_name]
        else:
            return 5000
