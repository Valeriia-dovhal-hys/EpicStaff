import { Injectable } from '@angular/core';
import { FlowService } from './flow.service';

import { NodeModel } from '../core/models/node.model';
import { ConnectionModel } from '../core/models/connection.model';

import { v4 as uuidv4 } from 'uuid'; // Install via: npm install uuid
import { FSelectionChangeEvent } from '@foblex/flow';
import { CustomPortId, ViewPort } from '../core/models/port.model';
import {
  parsePortId,
  getPortsForType,
  generatePortsForNode,
} from '../core/helpers/helpers';
import { NodeType } from '../core/enums/node-type';

interface ClipboardData {
  nodes: NodeModel[];
  connections: ConnectionModel[];
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
    if (!selection || selection.fNodeIds.length === 0) {
      console.warn('No selected nodes to copy.');
      return;
    }

    // 1) Get all nodes from the current flow state.
    const allNodes: NodeModel[] = this.flowService.getFlowState().nodes;
    const selectedNodes: NodeModel[] = allNodes.filter(
      (node) =>
        selection.fNodeIds.includes(node.id) && node.type !== NodeType.START // Exclude Start node
    );
    if (selectedNodes.length === 0) {
      console.warn('No nodes found matching selection.');
      return;
    }

    // 2) Compute a bounding box (for paste offset).
    const minX: number = Math.min(...selectedNodes.map((n) => n.position.x));
    const minY: number = Math.min(...selectedNodes.map((n) => n.position.y));

    // 3) Build a set of selected node IDs.
    const selectedNodeIdSet = new Set<string>(selectedNodes.map((n) => n.id));

    // 4) Get all connections from the current flow state.
    const allConnections: ConnectionModel[] =
      this.flowService.getFlowState().connections;
    const selectedConnections: ConnectionModel[] = allConnections.filter(
      (conn) => {
        const sourceParsed: {
          nodeId: string;
          portRole: string;
        } | null = parsePortId(conn.sourcePortId);
        const targetParsed: {
          nodeId: string;
          portRole: string;
        } | null = parsePortId(conn.targetPortId);
        if (!sourceParsed || !targetParsed) return false;
        return (
          selectedNodeIdSet.has(sourceParsed.nodeId) &&
          selectedNodeIdSet.has(targetParsed.nodeId)
        );
      }
    );

    // 5) Store a (shallow) clone of the selected nodes and connections in the clipboard.
    this.clipboard = {
      nodes: selectedNodes.map((node) => ({ ...node })),
      connections: selectedConnections.map((conn) => ({
        ...conn,
        sourceNodeId: conn.sourceNodeId,
        targetNodeId: conn.targetNodeId,
      })),
      boundingBox: { minX, minY },
    };

    console.log('Copied nodes + connections:', this.clipboard);
  }

  public paste(mousePosition: { x: number; y: number }): {
    newNodes: NodeModel[];
    newConnections: ConnectionModel[];
  } {
    if (!this.clipboard) {
      console.warn('Clipboard is empty, no nodes to paste.');
      return { newNodes: [], newConnections: [] };
    }

    const {
      nodes: clipboardNodes,
      connections: clipboardConnections,
      boundingBox,
    } = this.clipboard;

    if (clipboardNodes.length === 0) {
      console.warn('Clipboard has no nodes.');
      return { newNodes: [], newConnections: [] };
    }

    const offsetX = mousePosition.x - boundingBox.minX;
    const offsetY = mousePosition.y - boundingBox.minY;

    // Map old node IDs to new node IDs
    const oldToNewIdMap = new Map<string, string>();
    const newNodes: NodeModel[] = clipboardNodes.map((oldNode) => {
      const newNodeId = uuidv4(); // Generate a new UUID for the pasted node
      oldToNewIdMap.set(oldNode.id, newNodeId);

      const newPorts: ViewPort[] = generatePortsForNode(
        newNodeId,
        oldNode.type
      );

      return {
        ...oldNode,
        id: newNodeId,
        position: {
          x: oldNode.position.x + offsetX,
          y: oldNode.position.y + offsetY,
        },
        ports: newPorts,
      };
    });

    const newConnections = clipboardConnections
      .map((oldConn) => {
        const newSourceNodeId: string | undefined = oldToNewIdMap.get(
          oldConn.sourceNodeId
        );
        const newTargetNodeId: string | undefined = oldToNewIdMap.get(
          oldConn.targetNodeId
        );

        // Log the mapping results for this connection

        if (!newSourceNodeId || !newTargetNodeId) {
          console.warn(
            'Skipping connection due to missing new node mapping:',
            oldConn
          );
          return null;
        }

        // Create new port IDs using the same role from the old connection.
        const sourcePortParts = oldConn.sourcePortId.split('_');
        const targetPortParts = oldConn.targetPortId.split('_');

        // Ensure we have a valid port role in the split result.
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

    // Update the flow with new nodes and connections
    this.flowService.setFlow({
      ...currentFlow,
      nodes: [...currentFlow.nodes, ...newNodes],
      connections: [...currentFlow.connections, ...newConnections],
    });

    // Return the new nodes and connections for selection
    return { newNodes, newConnections };
  }
}
