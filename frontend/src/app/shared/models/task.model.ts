import { FullTask } from '../../open-project-page/models/full-task.model';

export interface TaskDto {
  id: number;

  name: string;
  instructions: string;
  expected_output: string;

  order: number | null;
  human_input: boolean;
  async_execution: boolean;
  config: any | null;
  output_model: any | null;

  crew: number | null;
  agent: number | null;

  task_context_list: number[];
  task_tool_list: number[];
}

export interface GetTaskRequest {
  id: number;

  name: string;
  instructions: string;
  expected_output: string;

  order: number | null;
  human_input: boolean;
  async_execution: boolean;
  config: any | null;
  output_model: any | null;

  crew: number | null;
  agent: number | null;

  task_context_list: number[];
  task_tool_list: number[];
}

export interface CreateTaskRequest {
  name: string;
  instructions: string;
  expected_output: string;

  order?: number | null;
  human_input?: boolean;
  async_execution?: boolean;
  config?: any | null;
  output_model?: any | null;

  crew?: number | null;
  agent?: number | null;
  task_context_list?: number[];
  task_tool_list?: number[];
}
export interface UpdateTaskRequest {
  id: number;

  name: string;
  instructions: string;
  expected_output: string;

  order?: number | null;
  human_input?: boolean;
  async_execution?: boolean;
  config?: any | null;
  output_model?: any | null;

  crew?: number | null;
  agent?: number | null;
  task_context_list?: number[];
  task_tool_list?: number[];
}
export interface TableFullTask extends Omit<FullTask, 'id'> {
  id: number | string;
}

//deprecated
export type TaskTableItem = Omit<Task, 'id'> & {
  id: number | null;
  assignedAgentRole: string;
};

//deprecated
export interface Task {
  id: number;
  name: string;
  instructions: string;
  expected_output: string;

  order?: number | null;
  human_input?: boolean;
  async_execution?: boolean;
  config?: any | null;
  output_model?: any | null;

  crew?: number | null;
  agent?: number | null;
  task_context_list?: number[];
  task_tool_list?: number[];
}
