export interface Agent {
  id: number;
  tools: number[];
  role: string;
  goal: string;
  backstory: string;
  allow_delegation: boolean;
  memory: boolean;
  max_iter: number;
  llm_model: number | null;
  fcm_llm_model: number | null;
  llm_config: number | null;
  fcm_llm_config: number | null;

  //custom
  llm_model_name: string | null;
  fcm_llm_model_name: string | null;
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
  llm_model: number | null;
  fcm_llm_model: number | null;
  llm_config: number | null;
  fcm_llm_config: number | null;
}
