// src/app/shared/models/agent-defaults.model.ts

export interface AgentDefaults {
  id: number;
  allow_delegation: boolean;
  memory: boolean;
  max_iter: number;
  llm_config: number | null; // If no config selected, this should be null
  fcm_llm_config: number | null; // Same logic for function LLM config
  llmConfigName?: string; // Optional field for the LLM Config Name
  fcmLlmConfigName?: string; // Optional field for the FCM LLM Config Name
}

export interface UpdateAgentDefaultsRequest {
  allow_delegation: boolean;
  memory: boolean;
  max_iter: number;
  llm_config: number | null; // If no config selected, this should be null
  fcm_llm_config: number | null; // Same logic for function LLM config
}
