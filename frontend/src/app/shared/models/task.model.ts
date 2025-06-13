export interface Task {
  id: number;
  crew: number | null;
  name: string;
  instructions: string;
  expected_output: string;
  order: number;
  agent: number | null;
}

export interface CreateTaskRequest {
  crew: number | null;
  name: string;
  instructions: string;
  expected_output: string;
  order: number; //required
  agent: number | null;
}

export type TaskTableItem = Omit<Task, 'id'> & {
  id: number | null;
  assignedAgentRole: string;
};
