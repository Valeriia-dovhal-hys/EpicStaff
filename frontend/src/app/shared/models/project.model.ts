export interface Variable {
  title: string;
  value: string;
}

//crew
export interface Project {
  id: number;
  name: string;
  assignment: string | null; // Nullable
  description: string | null; // Nullable
  process: 'sequential' | 'hierarchical'; // Required, no change needed
  memory: boolean; // Required, no change needed
  embedding_model: number | null; // Nullable
  manager_llm_model: number | null;
  manager_llm_config: number | null;
  agents: number[]; // Required, no change needed
  variables?: Variable[];
}

//getAgentRequest
export interface getProjectsRequest {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}
