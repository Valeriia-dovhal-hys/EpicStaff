export interface StartNode {
  id: number;
  graph: number;
  node_name: string;
  variables: Record<string, any>; // This indicates variables is a JSON object
}

export interface CreateStartNodeRequest {
  graph: number;
  variables: Record<string, any>; // This indicates variables is a JSON object
}
