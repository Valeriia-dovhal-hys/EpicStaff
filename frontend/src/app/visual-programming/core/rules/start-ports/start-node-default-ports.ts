import { BasePort } from '../../models/port.model';

export const DEFAULT_START_NODE_PORTS: BasePort[] = [
  {
    port_type: 'output',
    role: 'start-start',
    multiple: false,
    label: 'Out',
    allowedConnections: [
      'project-in',
      'python-in',
      'edge-in',
      'table-out',
      'llm-out-left',
    ],
    position: 'right',
    color: '#d3d3d3',
  },
];
