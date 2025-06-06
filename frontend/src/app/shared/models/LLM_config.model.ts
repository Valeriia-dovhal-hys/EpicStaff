export interface LLM_Config {
  id: number;
  temperature: number;
  num_ctx: number;
}

export interface CreateLLMConfigRequest {
  temperature: number;
  num_ctx: number;
}
