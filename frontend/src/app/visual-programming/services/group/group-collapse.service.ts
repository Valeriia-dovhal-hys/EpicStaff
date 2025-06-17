import { Injectable } from '@angular/core';
import { FlowService } from '../flow.service';
import { ConnectionModel } from '../../core/models/connection.model';
import { GroupNodeModel } from '../../core/models/group.model';
import { NodeModel } from '../../core/models/node.model';

@Injectable({
  providedIn: 'root',
})
export class GroupCollapserService {
  constructor(private flowService: FlowService) {}

  /**
   * Identifies external connections for a group and returns them categorized
   * @param groupId ID of the group to analyze
   * @returns Object with inputs and outputs arrays
   */
  public getGroupAllConnections(groupId: string): {
    inputs: ConnectionModel[];
    outputs: ConnectionModel[];
    internal: ConnectionModel[];
  } {
    // Get all flow data
    const allNodes = this.flowService.nodes();
    const allGroups = this.flowService.groups();
    const allConnections = this.flowService.connections();

    // Get the group
    const group = allGroups.find((g) => g.id === groupId);
    if (!group) {
      console.warn(`Group with ID ${groupId} not found`);
      return { inputs: [], outputs: [], internal: [] };
    }

    console.log(
      `Analyzing all connections for group: ${group.node_name} (${groupId})`
    );

    // Get all descendant nodes and groups
    const descendantIds = this.getAllDescendantIds(groupId);

    // Add the group itself to a set for easy checking
    const groupWithDescendants = new Set([...descendantIds, groupId]);

    console.log('Descendants:', {
      totalDescendants: descendantIds.size,
      descendantIds: Array.from(descendantIds),
    });

    // Find all connections that cross the group boundary
    const externalConnections = this.findExternalConnections(
      groupId,
      descendantIds,
      allConnections
    );

    // Find all connections that are completely internal to the group
    const internalConnections = allConnections.filter((conn) => {
      const sourceInside = groupWithDescendants.has(conn.sourceNodeId);
      const targetInside = groupWithDescendants.has(conn.targetNodeId);

      // Both ends must be inside the group or its descendants
      return sourceInside && targetInside;
    });

    // Categorize external connections as inputs or outputs
    const { inputs, outputs } = this.categorizeConnections(
      groupId,
      descendantIds,
      externalConnections
    );

    // Log the results
    console.log(`Group ${group.node_name} (${groupId}) has:`);
    console.log(`- ${inputs.length} input connections`);
    console.log(`- ${outputs.length} output connections`);
    console.log(`- ${internalConnections.length} internal connections`);

    return { inputs, outputs, internal: internalConnections };
  }

  /**
   * Gets IDs of all descendants (nodes and groups) of a group
   * @param groupId ID of the parent group
   * @returns Set of all descendant IDs (excluding the parent group itself)
   */
  public getAllDescendantIds(groupId: string): Set<string> {
    const descendantIds = new Set<string>();
    const allNodes = this.flowService.nodes();
    const allGroups = this.flowService.groups();

    // Recursive function to add descendants
    const addDescendants = (parentId: string) => {
      // Add direct child nodes
      allNodes.forEach((node) => {
        if (node.parentId === parentId) {
          descendantIds.add(node.id);
        }
      });

      // Add and process child groups
      allGroups.forEach((group) => {
        if (group.parentId === parentId) {
          descendantIds.add(group.id);
          // Recursively process this group's children
          addDescendants(group.id);
        }
      });
    };

    // Start recursion
    addDescendants(groupId);

    return descendantIds;
  }

  /**
   * Finds connections that cross the group boundary
   * @param groupId ID of the group
   * @param descendantIds Set of all descendant IDs
   * @param allConnections All connections in the flow
   * @returns Array of external connections
   */
  public findExternalConnections(
    groupId: string,
    descendantIds: Set<string>,
    allConnections: ConnectionModel[]
  ): ConnectionModel[] {
    return allConnections.filter((conn) => {
      // Check if source is inside (either a descendant or the group itself)
      const sourceInside =
        descendantIds.has(conn.sourceNodeId) || conn.sourceNodeId === groupId;

      // Check if target is inside (either a descendant or the group itself)
      const targetInside =
        descendantIds.has(conn.targetNodeId) || conn.targetNodeId === groupId;

      // Connection is external if exactly one end is inside
      return (sourceInside && !targetInside) || (!sourceInside && targetInside);
    });
  }

  /**
   * Categorizes connections as inputs or outputs
   * @param groupId ID of the group
   * @param descendantIds Set of all descendant IDs
   * @param connections Connections to categorize
   * @returns Object with inputs and outputs arrays
   */
  public categorizeConnections(
    groupId: string,
    descendantIds: Set<string>,
    connections: ConnectionModel[]
  ): { inputs: ConnectionModel[]; outputs: ConnectionModel[] } {
    const inputs = connections.filter(
      (conn) =>
        (descendantIds.has(conn.targetNodeId) ||
          conn.targetNodeId === groupId) &&
        !(descendantIds.has(conn.sourceNodeId) || conn.sourceNodeId === groupId)
    );

    const outputs = connections.filter(
      (conn) =>
        (descendantIds.has(conn.sourceNodeId) ||
          conn.sourceNodeId === groupId) &&
        !(descendantIds.has(conn.targetNodeId) || conn.targetNodeId === groupId)
    );

    return { inputs, outputs };
  }
}
