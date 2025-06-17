import { NodeType } from '../enums/node-type';
import { ConnectionModel } from './connection.model';
import { ViewPort } from './port.model';

export interface ConnectionData {
  inputs: ConnectionModel[];
  outputs: ConnectionModel[];
  internal: ConnectionModel[]; // Added internal connections
}

export interface GroupData {
  name: string;
  connectionData: ConnectionData | null; // Renamed from externalConnections to connectionData
  // Future fields can be added here
}

// Updated GroupNodeModel interface with data as an object
export interface GroupNodeModel {
  id: string;
  category: 'web';
  type: NodeType.GROUP;
  data: GroupData; // Object that includes a name property
  collapsed: boolean;
  position: { x: number; y: number };
  collapsedPosition: { x: number; y: number };
  ports: ViewPort[] | null;
  parentId: string | null;
  size: { width: number; height: number };
  color: string;
  backgroundColor: string;
  icon?: string;
  childPositions?: Map<string, { x: number; y: number }>;
  node_name: string;
}
