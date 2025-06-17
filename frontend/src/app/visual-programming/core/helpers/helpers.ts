import { BasePort, CustomPortId, ViewPort } from '../models/port.model';
import { NodeType } from '../enums/node-type';
import { DEFAULT_TOOL_NODE_PORTS } from '../rules/tool-ports/tool-node-default-ports';
import { DEFAULT_AGENT_NODE_PORTS } from '../rules/agent-ports/agent-node-default-ports';
import { PORTS_DICTIONARY } from '../rules/all_ports';
import { DEFAULT_LLM_NODE_PORTS } from '../rules/llm-ports/llm-node-default-ports';
import { DEFAULT_PROJECT_NODE_PORTS } from '../rules/project-ports/project-node-default-ports';
import { DEFAULT_TASK_NODE_PORTS } from '../rules/task-ports/task-node-defaults-ports';
import { DEFAULT_PYTHON_NODE_PORTS } from '../rules/python-ports/python-node-default-ports';
import { DEFAULT_EDGE_NODE_PORTS } from '../rules/edge-ports/edge-node-default-ports';
import { DEFAULT_START_NODE_PORTS } from '../rules/start-ports/start-node-default-ports';

import { DEFAULT_TABLE_NODE_PORTS } from '../rules/table-ports/table-ports';
import { DEFAULT_GROUP_NODE_PORTS } from '../rules/group-ports/group-node-default-ports';
import { NodeModel } from '../models/node.model';
import { ConditionGroup } from '../models/decision-table.model';

export function parsePortId(
  portId: string
): { nodeId: string; portRole: string } | null {
  const underscoreIndex = portId.indexOf('_');
  if (underscoreIndex === -1) return null;
  const nodeId = portId.substring(0, underscoreIndex);
  let portRole = portId.substring(underscoreIndex + 1);

  // If a colon exists, only keep the part before it.
  const colonIndex = portRole.indexOf(':');
  if (colonIndex !== -1) {
    portRole = portRole.substring(0, colonIndex);
  }

  return { nodeId, portRole };
}

export function getPortsForType(nodeType: NodeType): BasePort[] {
  switch (nodeType) {
    case NodeType.AGENT:
      return DEFAULT_AGENT_NODE_PORTS;
    case NodeType.TASK:
      return DEFAULT_TASK_NODE_PORTS;
    case NodeType.LLM:
      return DEFAULT_LLM_NODE_PORTS;
    case NodeType.TOOL:
      return DEFAULT_TOOL_NODE_PORTS;
    case NodeType.PROJECT:
      return DEFAULT_PROJECT_NODE_PORTS;
    case NodeType.PYTHON:
      return DEFAULT_PYTHON_NODE_PORTS;
    case NodeType.EDGE:
      return DEFAULT_EDGE_NODE_PORTS;
    case NodeType.START:
      return DEFAULT_START_NODE_PORTS;
    case NodeType.GROUP:
      return DEFAULT_GROUP_NODE_PORTS;
    case NodeType.TABLE:
      return DEFAULT_TABLE_NODE_PORTS;
    default:
      console.warn(`Unsupported node type: ${nodeType}`);
      return [];
  }
}

export function getPortByRole(portRole: string): BasePort | undefined {
  const port = PORTS_DICTIONARY[portRole];
  if (!port) {
    console.warn(`No port definition found for role: "${portRole}"`);
  }
  return port;
}

export function isConnectionValid(
  sourcePortId: CustomPortId,
  targetPortId: CustomPortId
): boolean {
  // 1️⃣ Parse the port IDs
  const sourceInfo = parsePortId(sourcePortId);
  const targetInfo = parsePortId(targetPortId);

  if (!sourceInfo || !targetInfo) {
    console.warn(`Could not parse portId(s): ${sourcePortId}, ${targetPortId}`);
    return false;
  }

  // 2️⃣ Look up BasePort definitions
  const sourcePort = getPortByRole(sourceInfo.portRole);
  const targetPort = getPortByRole(targetInfo.portRole);

  if (!sourcePort || !targetPort) {
    console.warn('One or both ports could not be found in PORTS_DICTIONARY:', {
      sourcePortId,
      targetPortId,
    });
    return false;
  }

  if (sourceInfo.nodeId === targetInfo.nodeId) {
    console.warn(`Cannot connect a node to itself: ${sourceInfo.nodeId}`);
    return false;
  }

  // 4️⃣ Disallow input→input or output→output
  if (
    (sourcePort.port_type === 'input' && targetPort.port_type === 'input') ||
    (sourcePort.port_type === 'output' && targetPort.port_type === 'output')
  ) {
    console.warn(
      `Cannot connect two ports of the same type: ${sourcePort.port_type}-${targetPort.port_type}`
    );
    return false;
  }

  // 5️⃣ Validate allowedConnections
  const sourceAllowsTarget = sourcePort.allowedConnections.includes(
    targetPort.role
  );
  const targetAllowsSource = targetPort.allowedConnections.includes(
    sourcePort.role
  );

  if (!sourceAllowsTarget || !targetAllowsSource) {
    console.warn(
      `Invalid connection roles: "${sourcePort.role}" -> "${targetPort.role}". 
         sourceAllowsTarget=${sourceAllowsTarget}, targetAllowsSource=${targetAllowsSource}`
    );
    return false;
  }

  // 🎉 If we reach here, it's valid
  return true;
}

export function defineSourceTargetPair(
  portIdA: CustomPortId,
  portIdB: CustomPortId
): { sourcePortId: CustomPortId; targetPortId: string } | null {
  // 1️⃣ Parse port IDs to get roles
  const parsedA = parsePortId(portIdA);
  const parsedB = parsePortId(portIdB);

  if (!parsedA || !parsedB) {
    console.warn('Could not parse one or both port IDs:', portIdA, portIdB);
    return null;
  }

  // 2️⃣ Look up their definitions in PORTS_DICTIONARY
  const portA: BasePort | undefined = getPortByRole(parsedA.portRole);
  const portB: BasePort | undefined = getPortByRole(parsedB.portRole);

  if (!portA || !portB) {
    console.warn('Could not find one or both ports:', { portIdA, portIdB });
    return null;
  }

  // 3️⃣ Determine which is source (output) and which is target (input)
  if (portA.port_type === 'output' && portB.port_type === 'input') {
    return {
      sourcePortId: portIdA,
      targetPortId: portIdB,
    };
  }

  if (portA.port_type === 'input' && portB.port_type === 'output') {
    return {
      sourcePortId: portIdB,
      targetPortId: portIdA,
    };
  }

  console.warn(
    `Unsupported port types: portA.type=${portA.port_type}, portB.type=${portB.port_type}`
  );
  return null;
}

export function generatePortsForNode(
  newNodeId: string,
  nodeType: NodeType,
  data?: any
): ViewPort[] {
  if (nodeType === NodeType.TABLE) {
    // Defensive: check for data.table.condition_groups
    const conditionGroups = data?.table?.condition_groups ?? [];
    return generatePortsForDecisionTableNode(newNodeId, conditionGroups);
  }
  const portsConfig: BasePort[] = getPortsForType(nodeType);
  return portsConfig.map((config) => ({
    ...config,
    id: `${newNodeId}_${config.role}`,
  }));
}

export function generatePortsForDecisionTableNode(
  nodeId: string,
  conditionGroups: ConditionGroup[]
): ViewPort[] {
  // Use the default input port from DEFAULT_TABLE_NODE_PORTS
  const inputPortConfig = DEFAULT_TABLE_NODE_PORTS.find(
    (p) => p.port_type === 'input'
  );
  const inputPort = {
    ...(inputPortConfig ?? {
      port_type: 'input',
      role: 'table-in',
      multiple: false,
      label: 'In',
      allowedConnections: [
        'project-out',
        'python-out',
        'edge-out',
        'table-out',
        'start-start',
        'llm-out-right',
      ],
      position: 'left',
      color: '#00aaff',
    }),
    id: `${nodeId}_table-in` as `${string}_${string}`,
  };

  const defaultOutputConfig = DEFAULT_TABLE_NODE_PORTS.find(
    (p) => p.port_type === 'output'
  );
  const outputPorts: ViewPort[] = conditionGroups.map((group) => ({
    ...(defaultOutputConfig ?? {
      port_type: 'output',
      allowedConnections: [
        'project-in',
        'python-in',
        'edge-in',
        'table-in',
        'llm-out-left',
      ],
      position: 'right',
      color: '#00aaff',
      multiple: false,
    }),
    role: `decision-out-${group.group_name}`,
    label: group.group_name,
    id: `${nodeId}_decision-out_${group.group_name}` as `${string}_${string}`,
  }));

  return [inputPort, ...outputPorts];
}
