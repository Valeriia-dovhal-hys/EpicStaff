export interface Agent {
  id: number;
  tools: number[];
  role: string;
  goal: string;
  backstory: string;
  allow_delegation: boolean;
  memory: boolean;
  max_iter: number;
  llm_model: string | null;
  fcm_llm_model: string | null;
  llm_config: string | null;
  fcm_llm_config: string | null;
  comments?: string;
  toolTitles?: string;
}

// Create Agent Request
export interface CreateAgentRequest {
  tools: number[];
  role: string;
  goal: string;
  backstory: string;
  allow_delegation: boolean;
  memory: boolean;
  max_iter: number;
  llm_model: string | null;
  fcm_llm_model: string | null;
  llm_config: string | null;
  fcm_llm_config: string | null;
}
