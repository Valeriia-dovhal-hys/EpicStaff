import { BasePort } from '../../models/port.model';

export const DEFAULT_PYTHON_NODE_PORTS: BasePort[] = [
  {
    port_type: 'input',
    role: 'python-in',
    multiple: true,
    label: 'In',
    allowedConnections: [
      'project-out',
      'python-out',
      'edge-out',
      'start-start',
      'table-out',

      'llm-out-right',
    ],
    position: 'left',
    color: '#ffcf3f',
  },

  {
    port_type: 'output',
    role: 'python-out',
    multiple: false,
    label: 'Out',
    allowedConnections: [
      'project-in',
      'python-in',
      'edge-in',
      'table-in',
      'llm-out-left',
    ],
    position: 'right',
    color: '#ffcf3f',
  },
];
