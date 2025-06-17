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

  realtime_agent: RealtimeAgentConfig;
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

  // New fields from the image
  realtime_agent: RealtimeAgentConfig;
}

export interface RealtimeAgentConfig {
  distance_threshold: string; // string(decimal)
  search_limit: number; // integer with min: 1, max: 1000
  wake_word: string | null;
  stop_prompt: string | null;
  language: string | null;
  voice_recognition_prompt: string | null;
  voice: string; // string with enum values (appears to have [1] option)
  realtime_config: number | null; // integer
  realtime_transcription_config: number | null; // integer
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
  realtime_agent: RealtimeAgentConfig;
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
  realtime_agent?: RealtimeAgentConfig;
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

  realtime_agent: RealtimeAgentConfig;
}

export type AgentTableItem = Omit<Agent, 'id'> & {
  id: number | null;
};

export interface AgentNode {
  id: number;
  type: 'agent' | 'task';
  reference_id: number;
}
