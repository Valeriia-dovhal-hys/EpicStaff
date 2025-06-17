import { Session } from '../../../shared/models/sesson.model';

export interface ProjectDto {
  id: number;
  name: string;
  description: string | null;
  process: 'sequential' | 'hierarchical';

  tasks: number[];
  agents: number[];

  memory: boolean | null;
  config: any | null;
  max_rmp: number | null;
  cache: boolean | null;
  full_output: boolean;
  default_temperature: number | null;
  planning: boolean;

  planning_llm_config: number | null;
  manager_llm_config: number | null;
  embedding_config: number | null;
}

export interface GetProjectRequest {
  id: number;
  name: string;
  description: string | null;
  process: 'sequential' | 'hierarchical';

  tasks: number[];
  agents: number[];

  memory: boolean | null;
  config: any | null;
  max_rmp: number | null;
  cache: boolean | null;
  full_output: boolean;
  default_temperature: number | null;
  planning: boolean;

  planning_llm_config: number | null;
  manager_llm_config: number | null;
  embedding_config: number | null;
}

// Create Project Request
export interface CreateProjectRequest {
  name: string;
  description: string | null;
  process: 'sequential' | 'hierarchical';
  tasks?: number[];
  agents?: number[];
  memory: boolean | null;
  config?: any | null;
  max_rmp?: number | null;
  cache?: boolean | null;
  full_output?: boolean;
  default_temperature?: number | null;
  planning?: boolean;
  planning_llm_config?: number | null;
  manager_llm_config?: number | null;
  embedding_config?: any;
}

// Create Project Request
export interface UpdateProjectRequest {
  id: number;
  name: string;
  description: string | null;
  process: 'sequential' | 'hierarchical';
  tasks?: number[];
  agents?: number[];
  memory: boolean | null;
  config?: any | null;
  max_rmp?: number | null;
  cache?: boolean | null;
  full_output?: boolean;
  default_temperature?: number | null;
  planning?: boolean;
  planning_llm_config?: number | null;
  manager_llm_config?: number | null;
  embedding_config?: any;
}
