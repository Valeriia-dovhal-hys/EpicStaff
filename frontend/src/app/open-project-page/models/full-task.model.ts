import { GetAgentRequest } from '../../shared/models/agent.model';
import { GetTaskRequest } from '../../shared/models/task.model';

export interface FullTask extends GetTaskRequest {
  agentData: GetAgentRequest | null;
}
