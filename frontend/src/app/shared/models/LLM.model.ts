export interface LLMModel {
  id: number; // ID, readOnly
  name: string; // Name, minLength: 1
  description?: string; // Comments, x-nullable
  base_url?: string; // Base URL, maxLength: 200, x-nullable
  deployment?: string; // Deployment, x-nullable
  llm_provider: number; // LLM provider, required
}
