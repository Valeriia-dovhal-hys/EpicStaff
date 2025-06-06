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
  order: number;
  agent: number | null;
}
