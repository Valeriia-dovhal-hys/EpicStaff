import { Pipe, PipeTransform } from '@angular/core';
import { GroupNodeModel, NodeModel } from '../models/node.model';

@Pipe({
  name: 'visibleNodes',
  pure: true,
  standalone: true,
})
export class VisibleNodesPipe implements PipeTransform {
  transform(nodes: NodeModel[], groups: GroupNodeModel[]): NodeModel[] {
    if (!nodes || !groups) {
      return nodes;
    }
    return nodes.filter((node) => {
      // Nodes without a parent are always visible.
      if (!node.parentId) return true;
      // Find the parent group.
      const parentGroup = groups.find((g) => g.id === node.parentId);
      // Only show the node if the parent group is not collapsed.
      return parentGroup ? !parentGroup.collapsed : true;
    });
  }
}
