import { NodeType } from '../enums/node-type';
import { NodeModel } from '../models/node.model';
import { NODE_TYPE_PREFIXES } from '../enums/node-type-prefixes';

/**
 * Generate a display name for a node, following the same rules as onAddNodeFromContextMenu.
 * @param type NodeType
 * @param data Optional node data (may contain name for PROJECT)
 * @param currentNodes All current nodes in the flow (for counting)
 */
export function generateNodeDisplayName(
  type: NodeType,
  data: any,
  currentNodes: NodeModel[]
): string {
  if (type === NodeType.PROJECT) {
    const projectName = data?.name || 'My Project';
    const count =
      currentNodes.filter((n) => n.type === NodeType.PROJECT).length + 1;
    return `${projectName} (#${count})`;
  } else {
    const prefix = NODE_TYPE_PREFIXES[type] || 'Node';
    const count = currentNodes.filter((n) => n.type === type).length + 1;
    return `${prefix} (#${count})`;
  }
}
