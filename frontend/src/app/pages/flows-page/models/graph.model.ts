import { CreatePythonCodeRequest } from '../../../user-settings-page/tools/custom-tool-editor/models/python-code.model';
import {
  ConditionalEdge,
  CreateConditionalEdgeRequest,
} from '../components/flow-visual-programming/models/conditional-edge.model';
import {
  CreateCrewNodeRequest,
  CrewNode,
} from '../components/flow-visual-programming/models/crew-node.model';
import {
  CreateEdgeRequest,
  Edge,
} from '../components/flow-visual-programming/models/edge.model';
import { GetLLMNodeRequest } from '../components/flow-visual-programming/models/llm-node.model';
import {
  CreatePythonNodeRequest,
  PythonNode,
} from '../components/flow-visual-programming/models/python-node.model';

export interface GraphDto {
  id: number;
  name: string;
  entry_point: string | null;
  crew_node_list: CrewNode[];
  python_node_list: PythonNode[];
  edge_list: Edge[];
  conditional_edge_list: ConditionalEdge[];
  llm_node_list: GetLLMNodeRequest[];
  description: string;
  metadata: any;
  tags?: [];
}

export interface CreateGraphDtoRequest {
  name: string;
  entry_point?: string | null;
  description?: string;
  metadata?: any;
  tags?: [];
}

export interface UpdateGraphDtoRequest {
  id: number;
  name: string;
  entry_point: string | null;
  description: string;
  metadata: any;
  tags?: [];
}
