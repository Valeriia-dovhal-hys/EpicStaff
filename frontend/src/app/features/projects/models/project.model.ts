import { Session } from '../../../shared/models/sesson.model';
import { GetCrewTagRequest } from './crew-tag.model';

export interface GetProjectRequest {
  id: number;
  name: string;
  description: string | null;
  process: 'sequential' | 'hierarchical';

  tasks: number[];
  agents: number[];
  tags: number[];

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

  metadata?: any | null;
}

// Create Project Request
export interface CreateProjectRequest {
  name: string;
  description: string | null;
  process: 'sequential' | 'hierarchical';
  tasks?: number[];
  agents?: number[];
  tags?: number[];
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
  metadata?: any | null;
}

// Create Project Request
export interface UpdateProjectRequest {
  id: number;
  name: string;
  description: string | null;
  process: 'sequential' | 'hierarchical';
  tasks?: number[];
  agents?: number[];
  tags?: number[];
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
