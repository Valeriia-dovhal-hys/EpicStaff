import { CustomConditionalEdgeModelForNode } from '../../../pages/flows-page/components/flow-visual-programming/models/conditional-edge.model';
import { AgentDto } from '../../../shared/models/agent.model';
import { LLMConfigDto } from '../../../shared/models/LLM_config.model';
import { GetProjectRequest } from '../../../pages/projects-page/models/project.model';
import { CreateTaskRequest, TaskDto } from '../../../shared/models/task.model';
import { ToolConfigDto } from '../../../shared/models/tool_config,model';
import { GetPythonCodeToolRequest } from '../../../user-settings-page/tools/custom-tool-editor/models/python-code-tool.model';
import {
  CreatePythonCodeRequest,
  CustomPythonCode,
} from '../../../user-settings-page/tools/custom-tool-editor/models/python-code.model';
import { NodeType } from '../enums/node-type';
import { ConnectionModel } from './connection.model';
import { ViewPort } from './port.model';

export interface BaseNodeModel {
  id: string;
  position: { x: number; y: number };
  ports: ViewPort[];
  parentId: string | null;
  node_name: string;
  color?: string;
  icon?: string;

  // Add this property for storing the offset relative to the parent group:
  relativePosition?: { x: number; y: number };

  // New fields
  input_map: Record<string, any>;
  output_variable_path: string | null;
}
export interface PythonNodeModel extends BaseNodeModel {
  type: NodeType.PYTHON;
  data: CustomPythonCode;
}
export interface ProjectNodeModel extends BaseNodeModel {
  type: NodeType.PROJECT;
  data: GetProjectRequest;
}
export interface TaskNodeModel extends BaseNodeModel {
  type: NodeType.TASK;
  data: CreateTaskRequest;
}

export interface AgentNodeModel extends BaseNodeModel {
  type: NodeType.AGENT;
  data: AgentDto;
}
export interface ToolNodeModel extends BaseNodeModel {
  type: NodeType.TOOL;
  data: ToolConfigDto;
}
export interface LLMNodeModel extends BaseNodeModel {
  type: NodeType.LLM;
  data: LLMConfigDto;
}

export interface EdgeNodeModel extends BaseNodeModel {
  type: NodeType.EDGE;
  data: CustomConditionalEdgeModelForNode;
}
export interface StartNodeModel extends BaseNodeModel {
  type: NodeType.START;
  data: null;
}
export interface GroupNodeModel extends BaseNodeModel {
  type: NodeType.GROUP;
  data: string;
  size: {
    width: number;
    height: number;
  };
  collapsed: boolean;
  expandedSize: {
    width: number;
    height: number;
  };
  collapsedConnections?: ConnectionModel[];
}
export interface DecisionTableNodeModel extends BaseNodeModel {
  type: NodeType.TABLE; // or NodeType.DECISION_TABLE if you prefer
  data: DecisionTableData;
}
// decision-table.model.ts
export interface DecisionTableData {
  name: string;
  orderType: 'or' | 'and';
  conditions: Condition[];
}
export interface Condition {
  name: string;
  value: string;
  order: number;
}

export type NodeModel =
  | AgentNodeModel
  | TaskNodeModel
  | ToolNodeModel
  | LLMNodeModel
  | ProjectNodeModel
  | PythonNodeModel
  | EdgeNodeModel
  | GroupNodeModel
  | StartNodeModel
  | DecisionTableNodeModel; // Added the DecisionTableNodeModel

// export interface ViewNodeModel extends BaseNodeModel {
//   type: NodeType;
//   data: AgentDto | TaskDto;
//   color: string;
// }
