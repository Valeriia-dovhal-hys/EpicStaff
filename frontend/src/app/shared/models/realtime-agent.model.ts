// Realtime Agent model based on the API schema
export interface RealtimeAgent {
  agent: number;
  distance_threshold: string;
  search_limit: number;
  wake_word: string | null;
  stop_prompt: string | null;

  language: string | null;
  voice_recognition_prompt: string | null;
  voice: string;
}

// PUT request model for updating a Realtime Agent
export interface UpdateRealtimeAgentRequest {
  agent: number;
  distance_threshold?: string;
  search_limit?: number;
  wake_word?: string;
  stop_prompt?: string;
  language?: string;
  voice_recognition_prompt?: string;
  voice?: string;
}
// PUT request model for updating a Realtime Agent
export interface CreateRealtimeAgentRequest {
  agent: number;
  distance_threshold?: string;
  search_limit?: number;
  wake_word?: string;
  stop_prompt?: string;
  language?: string;
  voice_recognition_prompt?: string;
  voice?: string;
}
