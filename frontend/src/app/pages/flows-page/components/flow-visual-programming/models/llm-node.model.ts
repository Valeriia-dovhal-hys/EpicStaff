export interface GetLLMNodeRequest {
  id: number;
  node_name: string;
  graph: number;
  llm_config: number;
  input_map: Record<string, any>;
  output_variable_path: string | null;
}
export interface CreateLLMNodeRequest {
  node_name: string;
  graph: number;
  llm_config: number;
  input_map: Record<string, any>;
  output_variable_path: string | null;
}
