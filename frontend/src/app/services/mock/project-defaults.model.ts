export interface ProjectDefaults {
  id: number;
  memory: boolean;
  manager_llm_config: number | null;
  embedding_config: number | null;
  process: 'hierarchical' | 'sequential';
}
// Interface for the PUT request (without 'id')
export interface UpdateProjectDefaultsRequest {
  process: 'hierarchical' | 'sequential';
  memory: boolean;
  embedding_config: number | null;
  manager_llm_config: number | null;
}
