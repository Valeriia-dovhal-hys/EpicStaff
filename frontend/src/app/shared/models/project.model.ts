// src/app/shared/models/project.model.ts

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
  embedding_model: number | null;
  manager_llm_model: number | null;
  manager_llm_config: number | null;
  agents: number[];
  // variables?: Variable[];
}

// Create Project Request
export interface CreateProjectRequest {
  name: string;
  assignment: string | null;
  description: string | null;
  process: 'sequential' | 'hierarchical';
  memory: boolean;
  embedding_model: number | null;
  manager_llm_model: number | null;
  manager_llm_config: number | null;
  agents: number[];
  // variables?: Variable[];
}
