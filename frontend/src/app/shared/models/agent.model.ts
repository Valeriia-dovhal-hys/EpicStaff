import { Tool } from './tool.model';

export enum LLM {
  GPT3 = 'GPT-3',
  GPT4 = 'GPT-4',
  LLaMA = 'LLaMA',
}

export interface Agent {
  id: number;
  tools: number[];
  role: string;
  goal: string;
  backstory: string;
  allow_delegation: boolean;
  memory: string; //string??
  temperature?: number;
  max_iter: number;
  llm_model: string | null;
  fcm_llm_model: string | null;
  llm_config: string | null;
  fcm_llm_config: string | null;
  comments?: string;
  toolTitles?: string;
}
// export interface Agent {
//   id: number;
//   tools: number[]; // Array of integers
//   role: string; // Required string, minLength: 1
//   goal: string; // Required string, minLength: 1
//   backstory: string; // Required string, minLength: 1
//   allow_delegation: boolean; // Boolean
//   memory: boolean; // Boolean
//   max_iter: number; // Integer, with specified min and max
//   llm_model: number; // Integer
//   fcm_llm_model?: number; // Optional integer (x-nullable: true)
//   llm_config?: number; // Optional integer (x-nullable: true)
//   fcm_llm_config?: number; // Optional integer (x-nullable: true)
//   comments?: string;
//   toolTitles?: string;
// }

//getAgentRequest
export interface getAgentsRequest {
  count: number;
  next: string | null;
  previous: string | null;
  results: Agent[];
}

//AgentCreateRequest
export interface AgentPostPut {
  id: string;
  comments?: string;
  role: string;
  goal: string;
  backstory: string;
  toolIds?: string[];
  allowDelegation: boolean;
  verbose: boolean;
  memory: boolean;
  max_iter: number;
  agent_llm: LLM;
  temperature: number;
  function_llm: LLM;
}
