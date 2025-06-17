import { BasePort } from '../../models/port.model';

export const DEFAULT_GROUP_NODE_PORTS: BasePort[] = [
  {
    port_type: 'input',
    role: 'group-left',
    multiple: true,
    label: 'Left',
    allowedConnections: [],
    position: 'left',
    color: '#8B8B8B', // GROUP color
  },
  {
    port_type: 'output',
    role: 'group-right',
    multiple: true,
    label: 'Right',
    allowedConnections: [],
    position: 'right',
    color: '#8B8B8B', // GROUP color
  },
  //   {
  //     port_type: 'input',
  //     role: 'group-top',
  //     multiple: true,
  //     label: 'Top',
  //     allowedConnections: [],
  //     position: 'top',
  //     color: '#1a7f37', // GROUP color
  //     defaultColor: '#8B8B8B', // Default grey color
  //   },
  {
    port_type: 'output',
    role: 'group-bottom',
    multiple: true,
    label: 'Bottom',
    allowedConnections: [],
    position: 'bottom',
    color: '#8B8B8B', // GROUP color
  },
];
