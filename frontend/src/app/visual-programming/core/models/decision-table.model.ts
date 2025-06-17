export interface DecisionTableNode {
  graph: null;
  node_name: null;
  default_next_node: string | null;
  condition_groups: ConditionGroup[];
}

export interface Graph {
  condition_groups: ConditionGroup[];
}

export interface ConditionGroup {
  group_name: string;
  group_type: 'simple' | 'complex';
  expression: string | null;
  conditions: Condition[];
  manipulation: string | null;
  next_node: string | null;
}

export interface Condition {
  condition_name: string;
  condition: string;
}
