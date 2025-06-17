import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { FlowModel } from '../core/models/flow.model';
import { GroupNodeModel, NodeModel } from '../core/models/node.model';
import { ConnectionModel } from '../core/models/connection.model';

import { IPoint } from '@foblex/2d';
import { CustomPortId, ViewPort } from '../core/models/port.model';
import { GroupModel } from '../core/models/group.model';
import { NodeType } from '../core/enums/node-type';
import { FDropToGroupEvent } from '@foblex/flow';

// Define types for port IDs and flattened port structure

export interface FlattenedPort {
  nodeId: string;
  port: ViewPort; // Replace 'any' with your actual port interface/type
}

@Injectable({
  providedIn: 'root',
})
export class FlowService {
  private flowSignal = signal<FlowModel>({
    nodes: [],
    connections: [],
    groups: [],
  });

  public nodes = computed(() => this.flowSignal().nodes);
  public connections = computed(() => this.flowSignal().connections);
  public groups = computed(() => this.flowSignal().groups);

  // Compute a mapping from each port id to an array of eligible connection port ids.
  // This is automatically recomputed when nodes or connections change.
  public portConnectionsMap = computed(
    (): Record<CustomPortId, CustomPortId[]> => {
      const nodes = this.flowSignal().nodes;
      const connections = this.flowSignal().connections;

      const allPorts: FlattenedPort[] = [];
      nodes.forEach((node) => {
        node.ports.forEach((port: ViewPort) => {
          allPorts.push({ nodeId: node.id, port });
        });
      });

      const connectionCount: Record<CustomPortId, number> = {};
      connections.forEach((conn) => {
        connectionCount[conn.sourcePortId] =
          (connectionCount[conn.sourcePortId] || 0) + 1;
        connectionCount[conn.targetPortId] =
          (connectionCount[conn.targetPortId] || 0) + 1;
      });

      const map: Record<CustomPortId, CustomPortId[]> = {};
      allPorts.forEach((current) => {
        // Start with an empty set so we don't include the port itself
        const eligible = new Set<CustomPortId>();

        const currentConnCount = connectionCount[current.port.id] || 0;
        if (!current.port.multiple && currentConnCount > 0) {
          // If already connected and single-use, no allowed connections.
          map[current.port.id] = ['__none__'];
          return;
        }

        allPorts.forEach((other) => {
          // Skip self
          if (current.port.id === other.port.id) return;

          // Pass the full connections array to our updated canPortsConnect check.
          if (this.canPortsConnect(current, other, connections)) {
            const otherConnCount = connectionCount[other.port.id] || 0;
            if (!other.port.multiple && otherConnCount > 0) {
              return;
            }
            eligible.add(other.port.id);
          }
        });

        const result = Array.from(eligible);
        // If no eligible ports found, add a dummy value that will never match.
        if (result.length === 0) {
          result.push('__none__');
        }
        map[current.port.id] = result;
      });
      return map;
    }
  );

  // Selector to get connections for a given port.
  public getConnectionsForPort(portId: CustomPortId): CustomPortId[] {
    return this.portConnectionsMap()[portId] || [];
  }

  constructor() {}

  public fetchFlow(projectId: string): Observable<FlowModel> {
    return of({
      nodes: [], // Return MOCK_NODES as is
      connections: [], // Return an empty connections array
      groups: [], // Return an empty groups array
    }).pipe(
      delay(500) // Add a 500ms delay to simulate fetching data
    );
  }
  public getFlowState(): FlowModel {
    return this.flowSignal();
  }

  public setFlow(flow: FlowModel) {
    console.log('Setting new flow state. Old state:', this.flowSignal());
    this.flowSignal.set(flow);
    console.log('New flow state:', this.flowSignal());
  }

  public addNode(node: NodeModel) {
    const flowNode: NodeModel = { ...node };
    this.flowSignal.update((flow: FlowModel) => ({
      ...flow,
      nodes: [...flow.nodes, flowNode],
    }));
  }
  public setFlowStateAfterPositionChange(
    node: NodeModel,
    newPos: IPoint
  ): void {
    this.flowSignal.update((flow: FlowModel) => {
      // Update the node in the nodes array
      const targetNode = flow.nodes.find(
        (existingNode) => existingNode.id === node.id
      );
      if (targetNode) {
        targetNode.position = newPos; // Directly mutate the object's position
      }

      // If the node is a group, update its position in the groups array as well.
      if (node.type === NodeType.GROUP) {
        flow.groups.forEach((group) => {
          if (group.id === node.id) {
            group.position = newPos;
          }
        });
      }

      return flow; // Return the updated flow state
    });
  }
  public setFlowStateAfterSizeChange(
    node: NodeModel,
    newSize: { width: number; height: number }
  ): void {
    this.flowSignal.update((flow: FlowModel) => {
      // Only update if the node is a group (we assume groups are stored in flow.groups)
      if (node.type === NodeType.GROUP) {
        // Find the group in the groups array and directly mutate its size.
        flow.groups.forEach((group) => {
          if (group.id === node.id) {
            console.log('new size', newSize);

            group.size = newSize;
            console.log('new group size', newSize);
          }
        });
      }
      // Return the same flow object to avoid unnecessary change detection if not needed.
      return flow;
    });
  }

  public deleteSelections(selections: {
    fNodeIds: string[];
    fConnectionIds: string[];
    fGroupIds: string[];
  }): void {
    this.flowSignal.update((flow: FlowModel) => {
      const nodeIdsToRemove = new Set(selections.fNodeIds);
      const portIdsToRemove = new Set<string>();

      // Process nodes, but skip deletion for Start nodes.
      flow.nodes.forEach((node) => {
        if (nodeIdsToRemove.has(node.id)) {
          if (node.type === NodeType.START) {
            // Exclude Start nodes from deletion.
            nodeIdsToRemove.delete(node.id);
          } else {
            // Mark its ports for removal.
            node.ports.forEach((port) => portIdsToRemove.add(port.id));
          }
        }
      });

      // Build a set of group IDs to remove.
      // Start with the ones provided in selections.fGroupIds.
      const groupIdsToRemove = new Set(selections.fGroupIds);

      // Also, add any group from the groups array that was selected via fNodeIds.
      flow.groups.forEach((group) => {
        if (nodeIdsToRemove.has(group.id) && group.type === NodeType.GROUP) {
          groupIdsToRemove.add(group.id);
        }
      });

      console.log('Group IDs to remove:', Array.from(groupIdsToRemove));

      // Update nodes:
      // - Filter out nodes that should be removed.
      // - For remaining nodes, if their parentId is one of the groups being removed, clear it.
      const updatedNodes: NodeModel[] = flow.nodes
        .filter((node) => !nodeIdsToRemove.has(node.id))
        .map((node) => {
          if (node.parentId && groupIdsToRemove.has(node.parentId)) {
            return { ...node, parentId: null };
          }
          return node;
        });

      // Remove connections that are directly selected or connected to ports marked for removal.
      const connectionIdsToRemove = new Set(selections.fConnectionIds);
      const updatedConnections = flow.connections.filter((conn) => {
        if (connectionIdsToRemove.has(conn.id)) {
          return false;
        }
        if (
          portIdsToRemove.has(conn.sourcePortId) ||
          portIdsToRemove.has(conn.targetPortId)
        ) {
          return false;
        }
        return true;
      });

      // Remove groups whose IDs are in groupIdsToRemove.
      const updatedGroups = flow.groups.filter(
        (group) => !groupIdsToRemove.has(group.id)
      );

      return {
        ...flow,
        nodes: updatedNodes,
        connections: updatedConnections,
        groups: updatedGroups,
      };
    });
  }

  public updateNode(updatedNode: NodeModel) {
    this.flowSignal.update((flow: FlowModel) => {
      // Find the index of the node to update
      const index: number = flow.nodes.findIndex(
        (n) => n.id === updatedNode.id
      );
      if (index < 0) {
        console.warn('Node not found in flow:', updatedNode.id);
        return flow; // Return unchanged flow if node isn't found
      }

      // Create a new array, replacing just the updated node
      const updatedNodes: NodeModel[] = [...flow.nodes];
      updatedNodes[index] = updatedNode;

      // Return a new FlowModel object (signals need new references)
      return {
        ...flow,
        nodes: updatedNodes,
      };
    });
  }
  public addGroup(group: GroupNodeModel): void {
    this.flowSignal.update((flow: FlowModel) => ({
      ...flow,
      groups: [...flow.groups, group],
    }));
  }
  public addConnection(conn: ConnectionModel) {
    // Update the flow state by adding the new connection
    this.flowSignal.update((flow: FlowModel) => ({
      ...flow,
      connections: [...flow.connections, conn],
    }));

    console.log('New connection added to the flow state:', conn);
  }
  public removeConnection(connId: string) {
    this.flowSignal.update((flow: FlowModel) => ({
      ...flow,
      connections: flow.connections.filter((c) => c.id !== connId),
    }));
  }

  private canPortsConnect(
    portA: FlattenedPort,
    portB: FlattenedPort,
    connections: ConnectionModel[]
  ): boolean {
    // Prevent connecting ports on the same node.
    if (portA.nodeId === portB.nodeId) {
      return false;
    }

    // If any connection already exists between the two nodes, do not allow any further connections.
    const alreadyConnected = connections.some(
      (conn) =>
        (conn.sourceNodeId === portA.nodeId &&
          conn.targetNodeId === portB.nodeId) ||
        (conn.sourceNodeId === portB.nodeId &&
          conn.targetNodeId === portA.nodeId)
    );
    if (alreadyConnected) {
      return false;
    }

    const a = portA.port;
    const b = portB.port;
    if (a.port_type === 'input' && b.port_type === 'output') {
      return a.allowedConnections.includes(b.role);
    }
    if (a.port_type === 'output' && b.port_type === 'input') {
      return b.allowedConnections.includes(a.role);
    }
    if (a.port_type === 'input-output' && b.port_type === 'input-output') {
      return (
        a.allowedConnections.includes(b.role) ||
        b.allowedConnections.includes(a.role)
      );
    }
    return false;
  }

  public groupNodes(event: FDropToGroupEvent): void {
    this.flowSignal.update((flow: FlowModel) => {
      const targetGroupId: string = event.fTargetNode;

      // Check if the target node exists in the groups array.
      const isGroup: boolean = flow.groups.some(
        (group) => group.id === targetGroupId
      );
      if (!isGroup) {
        console.warn(`Target node ${targetGroupId} is not a group.`);
        return flow;
      }

      // Update nodes: set parentId to targetGroupId for all nodes that are being grouped.
      const updatedNodes = flow.nodes.map((node) => {
        if (event.fNodes.includes(node.id)) {
          return { ...node, parentId: targetGroupId };
        }
        return node;
      });

      return {
        ...flow,
        nodes: updatedNodes,
      };
    });
  }
  public updateGroup(updatedGroup: GroupNodeModel): void {
    this.flowSignal.update((flow: FlowModel) => {
      const index = flow.groups.findIndex((g) => g.id === updatedGroup.id);
      if (index < 0) {
        console.warn('Group not found:', updatedGroup.id);
        return flow;
      }
      // Create a new array replacing just the updated group
      const updatedGroups: GroupNodeModel[] = [...flow.groups];
      updatedGroups[index] = updatedGroup;
      return {
        ...flow,
        groups: updatedGroups,
      };
    });
  }

  public updateGroupName(groupId: string, newName: string): void {
    const flow: FlowModel = this.flowSignal();

    // Find the group in place
    const targetGroup: GroupNodeModel | undefined = flow.groups.find(
      (g) => g.id === groupId
    );
    if (targetGroup) {
      // Update its 'data' property
      targetGroup.data = newName;
    }
  }
  updateGroupCollapsed(groupId: string, newCollapsed: boolean): void {
    this.flowSignal.update((flow: FlowModel) => {
      return {
        ...flow,
        groups: flow.groups.map((group) =>
          group.id === groupId ? { ...group, collapsed: newCollapsed } : group
        ),
      };
    });
  }

  public collapseGroupConnections(group: GroupNodeModel): void {
    console.log('--- Collapse Group Connections Triggered ---');
    console.log(
      'Before collapse, all connections:',
      this.flowSignal().connections
    );

    // Get IDs of child nodes belonging to the group.
    const childNodeIds = this.flowSignal()
      .nodes.filter((node) => node.parentId === group.id)
      .map((node) => node.id);

    // Initialize collapsedConnections on the group.
    group.collapsedConnections = [];

    // Prepare new connections that will use the group as a port.
    const newGroupConnections: ConnectionModel[] = [];

    // Filter out connections that involve any child node.
    // For each such connection:
    // - If both endpoints are children, simply store the connection.
    // - If only one endpoint is a child, store the connection and create a new one using the group.
    const updatedConnections = this.flowSignal().connections.filter(
      (connection) => {
        const isSourceChild = childNodeIds.includes(connection.sourceNodeId);
        const isTargetChild = childNodeIds.includes(connection.targetNodeId);
        let involvesChild = false;

        if (isSourceChild && isTargetChild) {
          // Connection is entirely within the group.
          involvesChild = true;
          group.collapsedConnections!.push({ ...connection });
          // Do NOT recreate this connection with the group id.
        } else if (isSourceChild && !isTargetChild) {
          involvesChild = true;
          group.collapsedConnections!.push({ ...connection });
          // Recreate the connection with the group as the source.
          const newConn: ConnectionModel = {
            ...connection,
            sourceNodeId: group.id,
            sourcePortId: group.id as CustomPortId, // Use group port id.
          };
          newGroupConnections.push(newConn);
        } else if (!isSourceChild && isTargetChild) {
          involvesChild = true;
          group.collapsedConnections!.push({ ...connection });
          // Recreate the connection with the group as the target.
          const newConn: ConnectionModel = {
            ...connection,
            targetNodeId: group.id,
            targetPortId: group.id as CustomPortId, // Use group port id.
          };
          newGroupConnections.push(newConn);
        }

        // Return true only if the connection does not involve any child.
        return !involvesChild;
      }
    );

    console.log('Filtered out connections (remaining):', updatedConnections);
    console.log('New group-level connections:', newGroupConnections);
    console.log(
      'Original connections stored in group.collapsedConnections:',
      group.collapsedConnections
    );

    // Update the flow state with the new connections.
    this.flowSignal.update((flow: FlowModel) => {
      const newConnections = [...updatedConnections, ...newGroupConnections];
      console.log('New connections array to be set:', newConnections);
      return {
        ...flow,
        connections: newConnections,
      };
    });

    console.log(
      'After collapse, new state connections:',
      this.flowSignal().connections
    );
    console.log('--- End Collapse Group Connections ---');
  }

  public expandGroupConnections(group: GroupNodeModel): void {
    // Remove the group-level connections (those that were added when the group collapsed)
    // We do this by filtering out any connection where the source or target node is the group id.
    const updatedConnections = this.flowSignal().connections.filter(
      (connection) => {
        return (
          connection.sourceNodeId !== group.id &&
          connection.targetNodeId !== group.id
        );
      }
    );

    // Restore the original connections stored in collapsedConnections.
    const restoredConnections = group.collapsedConnections || [];

    // Update the flow state with restored connections.
    this.flowSignal.update((flow: FlowModel) => ({
      ...flow,
      connections: [...updatedConnections, ...restoredConnections],
    }));

    // Clear the collapsedConnections field
    group.collapsedConnections = [];
  }
}
