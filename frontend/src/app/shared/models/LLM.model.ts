export interface LLM_Model {
  id: number;
  name: string;
  description: string | null;
  base_url: string | null;
  deployment: string | null;
  llm_provider: number;
}
