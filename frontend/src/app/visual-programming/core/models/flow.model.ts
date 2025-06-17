import { ConnectionModel } from './connection.model';
import { GroupModel } from './group.model';
import { GroupNodeModel, NodeModel } from './node.model';

export interface FlowModel {
  nodes: NodeModel[];
  connections: ConnectionModel[];
  groups: GroupNodeModel[];
}
