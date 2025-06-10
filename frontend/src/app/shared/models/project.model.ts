export interface Variable {
  title: string;
  value: string;
}

export interface Project {
  id: number;
  name: string;
  assignment: string | null;
  description: string | null;
  process: 'sequential' | 'hierarchical';
  memory: boolean;
  embedding_model: number;
  manager_llm_model: number;
  manager_llm_config: number;
  agents: number[];
}

// Create Project Request
export interface CreateProjectRequest {
  name: string;
  assignment: string | null;
  description: string | null;
  process: 'sequential' | 'hierarchical';
  memory: boolean;
  embedding_model: number;
  manager_llm_model: number;
  manager_llm_config: number;
  agents: number[];
}
