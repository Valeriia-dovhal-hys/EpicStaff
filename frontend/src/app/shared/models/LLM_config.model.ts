export interface LLM_Config {
  id: number | null;
  temperature?: number;
  num_ctx?: number;
}

export interface CreateLLMConfigRequest {
  temperature?: number;
  num_ctx?: number;
}
