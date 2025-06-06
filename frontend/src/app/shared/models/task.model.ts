export interface Task {
  id: number;
  crew: number | null;
  name: string;
  instructions: string;
  expected_output: string;
  order: number;
  agent: number | null;
}

//GET TASKS
export interface GetTasksRequest {
  count: number;
  next: string | null;
  previous: string | null;
  results: Task[];
}

// POST-PUT TASK
export interface TaskPostPut {
  id: string;
  project_name?: string;
  title: string;
  instructions: string;
  expectedOutput: string;
  order: number;
  task_project_id?: string;
  task_agent_id?: string;
  asyncExecution?: boolean;
}
