export interface LLMConfig {
  id: number;
  custom_name: string;
  activated: boolean;
  llm_model: number;
  temperature?: number | null;
  context?: number | null;
}

export interface GetLLMConfig {
  id: number;
  custom_name: string;
  activated: boolean;
  llm_model: number;
  temperature: number | null;
  context: number | null;
}
