export interface Agent {
  id: number;

  role: string;
  goal: string;
  backstory: string;

  configured_tools: number[];
  python_code_tools: number[];

  llm_config: number | null;
  fcm_llm_config: number | null;

  allow_delegation: boolean;
  memory: boolean;

  max_iter: number;
  max_rpm: number | null;
  max_execution_time: number | null;
  cache: boolean | null;
  allow_code_execution: boolean | null;
  max_retry_limit: number | null;
  respect_context_window: boolean | null;
  default_temperature: number | null;

  knowledge_collection: number | null;
  realtime_config: number | null;
  //future

  llm_config_name?: string | null;
  fcm_llm_config_name?: string | null;

  toolTitles?: string;
}

export interface AgentDto {
  id: number;

  role: string;
  goal: string;
  backstory: string;

  configured_tools: number[];
  python_code_tools: number[];

  llm_config: number | null;
  fcm_llm_config: number | null;

  allow_delegation: boolean;
  memory: boolean;

  max_iter: number;
  max_rpm: number | null;
  max_execution_time: number | null;
  cache: boolean | null;
  allow_code_execution: boolean | null;
  max_retry_limit: number | null;
  respect_context_window: boolean | null;
  default_temperature: number | null;

  knowledge_collection: number | null;
  realtime_config: number | null;
}

export interface GetAgentRequest {
  id: number;

  role: string;
  goal: string;
  backstory: string;

  configured_tools: number[];
  python_code_tools: number[];

  llm_config: number | null;
  fcm_llm_config: number | null;

  allow_delegation: boolean;
  memory: boolean;

  max_iter: number;
  max_rpm: number | null;
  max_execution_time: number | null;
  cache: boolean | null;
  allow_code_execution: boolean | null;
  max_retry_limit: number | null;
  respect_context_window: boolean | null;
  default_temperature: number | null;

  knowledge_collection: number | null;
  realtime_config: number | null;
}

// Create Agent Request
export interface CreateAgentRequest {
  role: string;
  goal: string;
  backstory: string;

  configured_tools?: number[];
  python_code_tools?: number[];

  llm_config?: number | null;
  fcm_llm_config?: number | null;

  allow_delegation?: boolean;
  memory?: boolean;

  max_iter?: number;
  max_rpm?: number | null;
  max_execution_time?: number | null;
  cache?: boolean | null;
  allow_code_execution?: boolean | null;
  max_retry_limit?: number | null;
  respect_context_window?: boolean | null;
  default_temperature?: number | null;

  knowledge_collection?: number | null;
  realtime_config?: number | null;
}

// Update Agent Request
export interface UpdateAgentRequest {
  id: number;
  role: string;
  goal: string;
  backstory: string;

  configured_tools: number[];
  python_code_tools: number[];

  llm_config: number | null;
  fcm_llm_config: number | null;

  allow_delegation: boolean;
  memory: boolean;

  max_iter: number;
  max_rpm: number | null;
  max_execution_time: number | null;
  cache: boolean | null;
  allow_code_execution: boolean | null;
  max_retry_limit: number | null;
  respect_context_window: boolean | null;
  default_temperature: number | null;

  knowledge_collection: number | null;
  realtime_config: number | null;
}

export type AgentTableItem = Omit<Agent, 'id'> & {
  id: number | null;
};

export interface AgentNode {
  id: number;
  type: 'agent' | 'task';
  reference_id: number;
}
