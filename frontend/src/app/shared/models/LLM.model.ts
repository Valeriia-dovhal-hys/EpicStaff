export interface LLM_Model {
  id: number;
  name: string;
  description?: string;
  base_url?: string;
  deployment?: string;
  llm_provider: number;
}
