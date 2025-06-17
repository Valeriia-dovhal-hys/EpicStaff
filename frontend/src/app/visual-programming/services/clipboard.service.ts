import { Injectable } from '@angular/core';
import { FlowService } from './flow.service';

import { NodeModel } from '../core/models/node.model';
import { ConnectionModel } from '../core/models/connection.model';
import { GroupNodeModel } from '../core/models/group.model';

import { v4 as uuidv4 } from 'uuid'; // Install via: npm install uuid
import { FSelectionChangeEvent } from '@foblex/flow';
import { CustomPortId, ViewPort } from '../core/models/port.model';
import {
  parsePortId,
  getPortsForType,
  generatePortsForNode,
} from '../core/helpers/helpers';
import { NodeType } from '../core/enums/node-type';
import { generateNodeDisplayName } from '../core/helpers/generate-node-display-name.util';

interface ClipboardData {
  nodes: NodeModel[];
  connections: ConnectionModel[];
  groups: GroupNodeModel[];
  boundingBox: { minX: number; minY: number };
}

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private clipboard: ClipboardData | null = null;

  constructor(private flowService: FlowService) {}

  public setClipboardData(data: ClipboardData): void {
    this.clipboard = data;
    console.log('Clipboard data set:', this.clipboard);
  }

  // Get clipboard data
  public getClipboardData(): ClipboardData | null {
    return this.clipboard;
  }

  public copy(selection: FSelectionChangeEvent): void {
    if (
      !selection ||
      (selection.fNodeIds.length === 0 && selection.fGroupIds.length === 0)
    ) {
      console.warn('No selected nodes or groups to copy.');
      return;
    }

    // 1) Get all nodes and groups from the current flow state
    const allNodes: NodeModel[] = this.flowService.getFlowState().nodes;
    const allGroups: GroupNodeModel[] = this.flowService.getFlowState().groups;

    // Get selected nodes (excluding Start nodes)
    const selectedNodes: NodeModel[] = allNodes.filter(
      (node) =>
        selection.fNodeIds.includes(node.id) && node.type !== NodeType.START
    );

    // Get selected groups and their descendants
    const selectedGroups: GroupNodeModel[] = [];
    const processedGroupIds = new Set<string>();

    // Helper function to recursively collect groups and their descendants
    const collectGroupAndDescendants = (groupId: string) => {
      if (processedGroupIds.has(groupId)) return;

      const group = allGroups.find((g) => g.id === groupId);
      if (!group) return;

      processedGroupIds.add(groupId);
      selectedGroups.push(group);

      // Add child groups recursively
      allGroups.forEach((g) => {
        if (g.parentId === groupId) {
          collectGroupAndDescendants(g.id);
        }
      });

      // Add nodes that belong to this group
      selectedNodes.push(
        ...allNodes.filter(
          (node) => node.parentId === groupId && node.type !== NodeType.START
        )
      );
    };

    // Process all selected groups
    selection.fGroupIds.forEach((groupId) => {
      collectGroupAndDescendants(groupId);
    });

    if (selectedNodes.length === 0 && selectedGroups.length === 0) {
      console.warn('No valid nodes or groups found for copying.');
      return;
    }

    // 2) Compute bounding box for all selected elements
    const allElements = [...selectedNodes, ...selectedGroups];
    const minX: number = Math.min(...allElements.map((el) => el.position.x));
    const minY: number = Math.min(...allElements.map((el) => el.position.y));

    // 3) Build sets of selected element IDs
    const selectedNodeIdSet = new Set<string>(selectedNodes.map((n) => n.id));
    const selectedGroupIdSet = new Set<string>(selectedGroups.map((g) => g.id));

    // 4) Get relevant connections
    const allConnections: ConnectionModel[] =
      this.flowService.getFlowState().connections;
    const selectedConnections: ConnectionModel[] = allConnections.filter(
      (conn) => {
        const sourceParsed = parsePortId(conn.sourcePortId);
        const targetParsed = parsePortId(conn.targetPortId);
        if (!sourceParsed || !targetParsed) return false;

        // Check if both ends of the connection are in selected nodes or groups
        const sourceInSelection =
          selectedNodeIdSet.has(sourceParsed.nodeId) ||
          selectedGroupIdSet.has(conn.sourceNodeId);
        const targetInSelection =
          selectedNodeIdSet.has(targetParsed.nodeId) ||
          selectedGroupIdSet.has(conn.targetNodeId);

        return sourceInSelection && targetInSelection;
      }
    );

    // 5) Store clones in clipboard
    this.clipboard = {
      nodes: selectedNodes.map((node) => ({ ...node })),
      groups: selectedGroups.map((group) => ({ ...group })),
      connections: selectedConnections.map((conn) => ({ ...conn })),
      boundingBox: { minX, minY },
    };

    console.log('Copied nodes, groups, and connections:', this.clipboard);
  }

  public paste(mousePosition: { x: number; y: number }): {
    newNodes: NodeModel[];
    newGroups: GroupNodeModel[];
    newConnections: ConnectionModel[];
  } {
    if (!this.clipboard) {
      console.warn('Clipboard is empty, nothing to paste.');
      return { newNodes: [], newGroups: [], newConnections: [] };
    }

    const {
      nodes: clipboardNodes,
      groups: clipboardGroups,
      connections: clipboardConnections,
      boundingBox,
    } = this.clipboard;

    if (clipboardNodes.length === 0 && clipboardGroups.length === 0) {
      console.warn('Clipboard has no nodes or groups.');
      return { newNodes: [], newGroups: [], newConnections: [] };
    }

    const offsetX = mousePosition.x - boundingBox.minX;
    const offsetY = mousePosition.y - boundingBox.minY;

    // Map old IDs to new IDs for both nodes and groups
    const oldToNewIdMap = new Map<string, string>();

    // Create new groups first
    const newGroups: GroupNodeModel[] = clipboardGroups.map((oldGroup) => {
      const newGroupId = uuidv4();
      oldToNewIdMap.set(oldGroup.id, newGroupId);

      return {
        ...oldGroup,
        id: newGroupId,
        position: {
          x: oldGroup.position.x + offsetX,
          y: oldGroup.position.y + offsetY,
        },
        // Update parentId if it exists and is in our selection
        parentId:
          (oldGroup.parentId && oldToNewIdMap.get(oldGroup.parentId)) || null,
      };
    });

    // Create new nodes
    const newNodes: NodeModel[] = clipboardNodes.map((oldNode) => {
      const newNodeId = uuidv4();
      oldToNewIdMap.set(oldNode.id, newNodeId);

      const newPorts: ViewPort[] = generatePortsForNode(
        newNodeId,
        oldNode.type
      );

      const currentNodes = this.flowService.getFlowState().nodes;
      const newNodeName = generateNodeDisplayName(
        oldNode.type,
        oldNode.data,
        currentNodes
      );

      return {
        ...oldNode,
        id: newNodeId,
        position: {
          x: oldNode.position.x + offsetX,
          y: oldNode.position.y + offsetY,
        },
        ports: newPorts,
        // Update parentId if it exists and is in our selection
        parentId:
          (oldNode.parentId && oldToNewIdMap.get(oldNode.parentId)) || null,
        node_name: newNodeName,
      };
    });

    // Create new connections
    const newConnections = clipboardConnections
      .map((oldConn) => {
        const newSourceNodeId = oldToNewIdMap.get(oldConn.sourceNodeId);
        const newTargetNodeId = oldToNewIdMap.get(oldConn.targetNodeId);

        if (!newSourceNodeId || !newTargetNodeId) {
          console.warn(
            'Skipping connection due to missing new node/group mapping:',
            oldConn
          );
          return null;
        }

        const sourcePortParts = oldConn.sourcePortId.split('_');
        const targetPortParts = oldConn.targetPortId.split('_');

        if (sourcePortParts.length < 2 || targetPortParts.length < 2) {
          console.warn('Unexpected port ID format in connection:', oldConn);
          return null;
        }

        const newSourcePortId = `${newSourceNodeId}_${sourcePortParts[1]}`;
        const newTargetPortId = `${newTargetNodeId}_${targetPortParts[1]}`;
        const newConnectionId = `${newSourcePortId}+${newTargetPortId}`;

        return {
          id: newConnectionId,
          sourceNodeId: newSourceNodeId,
          targetNodeId: newTargetNodeId,
          sourcePortId: newSourcePortId as CustomPortId,
          targetPortId: newTargetPortId as CustomPortId,
        };
      })
      .filter((conn) => conn !== null) as ConnectionModel[];

    const currentFlow = this.flowService.getFlowState();

    // Update the flow with new elements
    this.flowService.setFlow({
      ...currentFlow,
      nodes: [...currentFlow.nodes, ...newNodes],
      groups: [...currentFlow.groups, ...newGroups],
      connections: [...currentFlow.connections, ...newConnections],
    });

    // Return all new elements for selection
    return { newNodes, newGroups, newConnections };
  }
}
