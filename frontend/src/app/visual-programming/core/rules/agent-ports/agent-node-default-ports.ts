import { BasePort } from '../../models/port.model';

export const DEFAULT_AGENT_NODE_PORTS: BasePort[] = [
  {
    port_type: 'input',
    role: 'agent-llm',
    multiple: false,
    label: 'LLM',
    allowedConnections: [
      'llm_out_top',
      'llm_out_right',
      'llm_out_bottom',
      'llm_out_left',
    ],
    position: 'top',
    color: '#e0575b', // LLM color mapping
  },
  {
    port_type: 'input',
    role: 'agent-function-calling-llm',
    multiple: false,
    label: 'Function Call. LLM',
    allowedConnections: [
      'llm-out-top',
      'llm-out-right',
      'llm-out-bottom',
      'llm_out-left',
    ],
    position: 'top',
    color: '#e0575b', // LLM color mapping
  },
  {
    port_type: 'input',
    role: 'agent-embedder-config',
    multiple: true,
    label: 'Embedder',
    allowedConnections: [],
    position: 'top',
    color: '#8e5cd9', // AGENT color
  },
  {
    port_type: 'input',
    role: 'agent-variables',
    multiple: true,
    label: 'Variables',
    allowedConnections: [],
    position: 'top',
    color: '#8e5cd9', // AGENT color
  },
  {
    port_type: 'output',
    role: 'agent-step-callback',
    multiple: true,
    label: 'Step Callback',
    allowedConnections: [],
    position: 'right',
    color: '#8e5cd9', // AGENT color
  },

  {
    port_type: 'input',
    role: 'agent-out-tools',
    multiple: true,
    label: 'Tools',
    allowedConnections: [
      'tool-out-top',
      'tool-out-right',
      'tool-out-bottom',
      'tool-out-left',
    ],
    position: 'bottom',
    color: '#9f6a00', // TOOL color mapping
  },
  {
    port_type: 'input',
    role: 'agent-knowledge',
    multiple: true,
    label: 'Knowledge Sources',
    allowedConnections: [],
    position: 'bottom',
    color: '#8e5cd9', // AGENT color
  },
  {
    port_type: 'output',
    role: 'agent-tasks',
    multiple: true,
    label: 'Tasks',
    allowedConnections: ['task-agent'],
    position: 'left',
    color: '#30a46c', // TASK color mapping
  },
];
