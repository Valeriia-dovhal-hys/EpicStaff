export interface Tool {
  id: number;
  name: string;
  name_alias: string;
  description: string;
  requires_model: boolean;
  enabled: boolean;
  llm_model: number | null;
  llm_config: number | null;
  embedding_model: number | null;
}
