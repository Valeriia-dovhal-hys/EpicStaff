export interface Edge {
  id: number;
  start_key: string;
  end_key: string;
  graph: number;
}
export interface CreateEdgeRequest {
  start_key: string;
  end_key: string;
  graph: number;
}
