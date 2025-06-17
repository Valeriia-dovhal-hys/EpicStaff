import { CreatePythonCodeRequest } from '../../tools/models/python-code.model';
import { FlowModel } from '../../../visual-programming/core/models/flow.model';
import {
  ConditionalEdge,
  CreateConditionalEdgeRequest,
} from '../../../pages/flows-page/components/flow-visual-programming/models/conditional-edge.model';
import {
  CreateCrewNodeRequest,
  CrewNode,
} from '../../../pages/flows-page/components/flow-visual-programming/models/crew-node.model';
import {
  CreateEdgeRequest,
  Edge,
} from '../../../pages/flows-page/components/flow-visual-programming/models/edge.model';
import { GetLLMNodeRequest } from '../../../pages/flows-page/components/flow-visual-programming/models/llm-node.model';
import {
  CreatePythonNodeRequest,
  PythonNode,
} from '../../../pages/flows-page/components/flow-visual-programming/models/python-node.model';
import { StartNode } from '../../../pages/flows-page/components/flow-visual-programming/models/start-node.model';

export interface GraphDto {
  id: number;
  name: string;
  start_node_list: StartNode[];
  crew_node_list: CrewNode[];
  python_node_list: PythonNode[];
  edge_list: Edge[];
  conditional_edge_list: ConditionalEdge[];
  llm_node_list: GetLLMNodeRequest[];
  description: string;
  metadata: FlowModel;
  tags?: [];
}

export interface GetGraphLightRequest {
  id: number;
  name: string;
  description: string;
  tags: string[];
}

export interface CreateGraphDtoRequest {
  name: string;

  description?: string;
  metadata?: any;
  tags?: [];
}

export interface UpdateGraphDtoRequest {
  id: number;
  name: string;

  description: string;
  metadata: any;
  tags?: [];
}
