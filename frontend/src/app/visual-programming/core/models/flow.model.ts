import { ConnectionModel } from './connection.model';
import { GroupNodeModel } from './group.model';

import { NodeModel } from './node.model';

export interface FlowModel {
  nodes: NodeModel[];
  connections: ConnectionModel[];
  groups: GroupNodeModel[];
}
