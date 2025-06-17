import { BasePort } from '../../models/port.model';

export const DEFAULT_LLM_NODE_PORTS: BasePort[] = [
  {
    port_type: 'output',

    role: 'llm-out-right',
    multiple: true,
    label: 'Out Right',
    allowedConnections: [
      'agent-llm',
      'agent-function-calling-llm',
      'start-start',
      'edge-in',
      'edge-out',
      'project-in',
      'project-out',
      'python-out',
      'python-in',
      'table-in',
    ],
    position: 'right',
    color: '#e0575b', // LLM color mapping
  },

  {
    port_type: 'input',
    role: 'llm-out-left',
    multiple: true,
    label: 'Out Left',
    allowedConnections: [
      'agent-llm',
      'agent-function-calling-llm',
      'start-start',
      'edge-in',
      'edge-out',
      'project-in',
      'project-out',
      'python-out',
      'python-in',
    ],
    position: 'left',
    color: '#e0575b', // LLM color mapping
  },
];
