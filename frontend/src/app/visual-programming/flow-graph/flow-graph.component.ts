import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FCreateNodeEvent,
  EFMarkerType,
  FCanvasComponent,
  FFlowModule,
  FZoomDirective,
  FReassignConnectionEvent,
  FCreateConnectionEvent,
  FFlowComponent,
  FSelectionChangeEvent,
  EFResizeHandleType,
  ICurrentSelection,
  FDropToGroupEvent,
  FCanvasChangeEvent,
} from '@foblex/flow';
import { IPoint, IRect, Point, PointExtensions } from '@foblex/2d';

import { FlowService } from '../services/flow.service';

import { ActivatedRoute, Router } from '@angular/router';
import { ShortcutListenerDirective } from '../core/directives/shortcut-listener.directive';
import { UndoRedoService } from '../services/undo-redo.service';
import { ClipboardService } from '../services/clipboard.service';
import { MouseTrackerDirective } from '../core/directives/mouse-tracker.directive';
import { debounceTime, Subject } from 'rxjs';
import {
  GroupNodeModel,
  NodeModel,
  StartNodeModel,
} from '../core/models/node.model';
import { ConnectionModel } from '../core/models/connection.model';

import { CustomPortId, ViewPort } from '../core/models/port.model';
import {
  isConnectionValid,
  defineSourceTargetPair,
  generatePortsForNode,
} from '../core/helpers/helpers';

import { NgClass, NgIf } from '@angular/common';
import { NodeType } from '../core/enums/node-type';
import { v4 as uuidv4 } from 'uuid';
import { FlowGraphContextMenuComponent } from '../components/flow-graph-context-menu/flow-graph-context-menu.component';

import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { DynamicSidePanelHostComponent } from '../components/side-panel-host/dynamic-side-panel.component';
import { FlowBaseNodeComponent } from '../components/flow-base-node/flow-base-node.component';
import { NODE_COLORS, NODE_ICONS } from '../core/enums/node-config';

import { FormsModule } from '@angular/forms';
import { NODE_TYPE_PREFIXES } from '../core/enums/node-type-prefixes';
import { FlowModel } from '../core/models/flow.model';
import { VisibleNodesPipe } from '../core/pipes/visible-nodes.pipe';
import { FlowStateData } from '../core/models/flow-state-data.model';

@Component({
  selector: 'app-flow-graph',
  templateUrl: './flow-graph.component.html',
  styleUrls: ['../styles/_variables.scss', './flow-graph.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  //   providers: [FlowService],
  imports: [
    FZoomDirective,
    FFlowModule,
    FormsModule,
    FlowBaseNodeComponent,
    ShortcutListenerDirective,
    MouseTrackerDirective,
    FlowGraphContextMenuComponent,
    NgIf,
    ClickOutsideDirective,
    DynamicSidePanelHostComponent,
    VisibleNodesPipe,
    NgClass,
  ],
})
export class FlowGraphComponent implements OnInit {
  @Input() flowState!: FlowModel;
  @Output() graphDataEmitted = new EventEmitter<FlowStateData>(); // Emit the data to parent

  @ViewChild(FFlowComponent, { static: false })
  public fFlowComponent!: FFlowComponent;

  @ViewChild(FCanvasComponent, { static: true })
  public fCanvasComponent!: FCanvasComponent;

  @ViewChild(FZoomDirective, { static: true })
  public fZoomDirective!: FZoomDirective;
  public readonly eMarkerType = EFMarkerType;

  public isLoaded: boolean = false;
  public mouseCursorPosition: { x: number; y: number } = { x: 0, y: 0 };
  public contextMenuPostion: { x: number; y: number } = {
    x: 0,
    y: 0,
  };
  public showContextMenu = signal(false);

  public selectedNode: NodeModel | null = null;

  public editedGroupId: string | null = null;
  public editGroupName: string = '';

  protected readonly eResizeHandleType = EFResizeHandleType;
  constructor(
    public flowService: FlowService,
    private undoRedoService: UndoRedoService,
    private clipboardService: ClipboardService
  ) {}
  public ngOnInit(): void {
    // Check if a Start node already exists
    console.log(this.flowState);

    const alreadyHasStart: boolean = this.flowState.nodes.some(
      (node) => node.type === NodeType.START
    );
    if (!alreadyHasStart) {
      // Generate unique ID
      const newStartNodeId: string = uuidv4();

      // Create a new Start node
      const startNode: StartNodeModel = {
        id: newStartNodeId,
        type: NodeType.START,
        node_name: 'Start',
        data: null,
        position: { x: 400, y: 300 }, // Adjust center position as needed
        ports: generatePortsForNode(newStartNodeId, NodeType.START), // Generate ports
        parentId: null,
        color: NODE_COLORS[NodeType.START], // Assign color from config
        icon: NODE_ICONS[NodeType.START], // Assign icon from config

        input_map: {}, // Empty object as default
        output_variable_path: null, // null as default
      };

      // Add Start node to the flow
      this.flowState.nodes.push(startNode);
    }
    this.flowService.setFlow(this.flowState);
  }
  ngDoCheck() {
    console.log('PERFORMANCE!');
  }
  public onInitialized(): void {
    this.fCanvasComponent.fitToScreen(new Point(140, 140), false);
  }
  public updateMouseTrackerPosition(event: { x: number; y: number }) {
    this.mouseCursorPosition = event;
  }

  public onNodeAdded(event: FCreateNodeEvent): void {}

  public onReassignConnection(event: FReassignConnectionEvent): void {
    // Save the state for undo before making any changes
    this.undoRedoService.stateChanged();
    console.log('reassign conncetion', event);

    // Step 1: find the old connection from the connections list
    const oldConnection: ConnectionModel | undefined = this.flowService
      .connections()
      .find((conn) => conn.id === event.fConnectionId);

    if (!oldConnection) {
      console.warn('Old connection not found:', event.fConnectionId);
      return;
    }

    // Step 2: Construct the new connection from the new input port (if available)
    if (!event.newFInputId) {
      console.warn(
        'No new input ID provided. Connection cannot be reassigned.'
      );
      return;
    }
    const newTargetNodeId: string = event.newFInputId.split('_')[0];

    // Lookup source and target nodes from flow state
    const nodes = this.flowService.nodes();
    const sourceNode = nodes.find(
      (node) => node.id === oldConnection.sourceNodeId
    );
    const targetNode = nodes.find((node) => node.id === newTargetNodeId);

    // Derive colors from source and target node types
    const startColor = sourceNode ? NODE_COLORS[sourceNode.type] : '#ddd';
    const endColor = targetNode ? NODE_COLORS[targetNode.type] : '#ddd';

    const newConnection: ConnectionModel = {
      id: `${event.fOutputId}+${event.newFInputId}`,
      sourceNodeId: oldConnection.sourceNodeId,
      targetNodeId: newTargetNodeId,
      sourcePortId: event.fOutputId as CustomPortId,
      targetPortId: event.newFInputId as CustomPortId,
      startColor,
      endColor,
    };

    // Step 3: Validate the new connection
    if (
      !isConnectionValid(newConnection.sourcePortId, newConnection.targetPortId)
    ) {
      console.warn(
        'New connection is invalid. Reassigning aborted.',
        newConnection
      );
      return;
    }

    // Step 4: Remove the old connection and add the new one
    this.flowService.removeConnection(event.fConnectionId);
    this.flowService.addConnection(newConnection);
    console.log(this.flowService.getFlowState());
    console.log('Reassigned connection successfully added:', newConnection);
  }

  public onConnectionAdded(event: FCreateConnectionEvent): void {
    // Save the state for undo before adding the connection
    this.undoRedoService.stateChanged();

    const { fOutputId, fInputId } = event;

    if (!fInputId) {
      console.warn('Connection event received without an input ID:', event);
      return;
    }

    if (
      !isConnectionValid(fOutputId as CustomPortId, fInputId as CustomPortId)
    ) {
      console.warn(
        'Connection is invalid and will not be added:',
        fOutputId,
        fInputId
      );
      return;
    }

    const pair = defineSourceTargetPair(
      fOutputId as CustomPortId,
      fInputId as CustomPortId
    );
    if (!pair) {
      console.warn(
        'Failed to define source-target pair for ports:',
        fOutputId,
        fInputId
      );
      return;
    }

    // Generate a new connection ID
    const newConnectionId: CustomPortId =
      `${pair.sourcePortId}+${pair.targetPortId}` as CustomPortId;

    // Get the current list of connections from the flow service
    const currentConnections = this.flowService.connections();

    // If the connection already exists, don't add it
    const isDuplicate = currentConnections.some(
      (conn) => conn.id === newConnectionId
    );
    if (isDuplicate) {
      console.warn('Duplicate connection detected, ignoring:', newConnectionId);
      return;
    }

    // Extract the source and target node IDs from the port IDs
    const sourceNodeId = pair.sourcePortId.split('_')[0];
    const targetNodeId = pair.targetPortId.split('_')[0];

    // Find the corresponding nodes in the flow state
    const sourceNode = this.flowService
      .nodes()
      .find((node) => node.id === sourceNodeId);
    const targetNode = this.flowService
      .nodes()
      .find((node) => node.id === targetNodeId);

    // Get the start and end colors based on node type, using the NODE_COLORS mapping
    const startColor = sourceNode ? NODE_COLORS[sourceNode.type] : '#ddd';
    const endColor = targetNode ? NODE_COLORS[targetNode.type] : '#ddd';

    // Create the new connection object based on your models with added color properties
    const newConnection: ConnectionModel = {
      id: newConnectionId,
      sourceNodeId: sourceNodeId,
      targetNodeId: targetNodeId,
      sourcePortId: pair.sourcePortId as CustomPortId,
      targetPortId: pair.targetPortId as CustomPortId,
      startColor,
      endColor,
    };
    // Add the new connection to the flow service
    this.flowService.addConnection(newConnection);
  }
  public onNodeSizeChanged(
    newSize: { width: number; height: number },
    node: NodeModel
  ): void {
    // Save undo state
    this.undoRedoService.stateChanged();

    // Update the group's size in the flow state (only for group nodes)
    this.flowService.setFlowStateAfterSizeChange(node, newSize);
  }

  public onNodePositionChanged(newPos: IPoint, node: NodeModel): void {
    this.undoRedoService.stateChanged();

    // Apply the new position to the node
    this.flowService.setFlowStateAfterPositionChange(node, newPos);
  }
  public onCopy(): void {
    // Assume fFlowComponent.getSelection() returns a FSelectionChangeEvent
    console.log('copying');
    const selections: FSelectionChangeEvent =
      this.fFlowComponent.getSelection();

    this.clipboardService.copy(selections);
  }
  // Triggered on paste
  public onPaste(): void {
    let pastePosition: IRect;

    if (this.mouseCursorPosition) {
      pastePosition = this.fFlowComponent.getPositionInFlow(
        PointExtensions.initialize(
          this.mouseCursorPosition.x,
          this.mouseCursorPosition.y
        )
      );
    } else {
      console.warn(
        'No current mouse position available, using default paste position.'
      );
      pastePosition = { x: 0, y: 0 } as IRect; // Set default position
    }

    this.undoRedoService.stateChanged();

    const { newNodes, newConnections } =
      this.clipboardService.paste(pastePosition);

    // After pasting, select the new nodes and connections
    const newNodeIds: string[] = newNodes.map((node) => node.id);
    const newConnectionIds: string[] = newConnections.map((conn) => conn.id);

    setTimeout(() => {
      this.fFlowComponent.select(newNodeIds, newConnectionIds);
    }, 0);

    console.log('Pasted nodes:', newNodes);
    console.log('Pasted connections:', newConnections);
  }

  public onUndo(): void {
    this.undoRedoService.onUndo();
  }

  public onRedo(): void {
    this.undoRedoService.onRedo();
  }

  public onDelete(): void {
    const selections: ICurrentSelection = this.fFlowComponent.getSelection();
    if (
      !selections ||
      (selections.fNodeIds.length === 0 &&
        selections.fConnectionIds.length === 0 &&
        selections.fGroupIds.length === 0)
    ) {
      console.warn('No items selected to delete.');
      return;
    }
    console.log('Deleting selected items:', selections);
    this.undoRedoService.stateChanged();
    this.flowService.deleteSelections({
      fNodeIds: selections.fNodeIds,
      fConnectionIds: selections.fConnectionIds,
      fGroupIds: selections.fGroupIds, // Pass group ids to the service
    });
  }

  public onContextMenu(event: MouseEvent): void {
    event.preventDefault();

    console.log(this.mouseCursorPosition);

    this.contextMenuPostion = event;

    this.showContextMenu.set(true);
  }
  public onClose(): void {
    console.log('closing');

    this.showContextMenu.set(false);
  }
  public nodeSelected(event: { type: NodeType; data?: any }): void {
    console.log('Node selected:', event.data);
    this.showContextMenu.set(false);

    // For nodes, generate a new unique node name.
    const newNodeId: string = uuidv4();
    const nodeColor: string = NODE_COLORS[event.type] || '#ddd'; // Default color if not found
    const nodeIcon: string = NODE_ICONS[event.type] || 'ti ti-help';

    const position: IPoint = this.fFlowComponent.getPositionInFlow(
      PointExtensions.initialize(
        this.contextMenuPostion.x,
        this.contextMenuPostion.y
      )
    );

    // If it's a TABLE node, extract conditions; otherwise, leave undefined
    const conditions =
      event.type === NodeType.TABLE ? event.data?.conditions || [] : undefined;

    // Pass conditions to generatePortsForNode
    const ports: ViewPort[] = generatePortsForNode(
      newNodeId,
      event.type,
      conditions
    );

    // Get all current nodes from the flow state
    const currentNodes = this.flowService.getFlowState().nodes;

    // Generate node name based on type
    let newNodeName: string;

    if (event.type === NodeType.PROJECT) {
      // For Project nodes, use the project name with a counter
      const projectName = event.data?.name || 'My Project';
      // Filter only project nodes
      const projectNodes = currentNodes.filter(
        (n) => n.type === NodeType.PROJECT
      );
      // Create name with counter
      newNodeName = `${projectName} (#${projectNodes.length + 1})`;
    } else {
      // For other node types, use the prefix system
      const prefix = NODE_TYPE_PREFIXES[event.type as NodeType] || 'Node';
      // Filter for nodes of the same type
      const sameTypeNodes = currentNodes.filter((n) => n.type === event.type);
      // Generate name with counter using parentheses format
      newNodeName = `${prefix} (#${sameTypeNodes.length + 1})`;
    }

    if (event.type === NodeType.GROUP) {
      const newNode: GroupNodeModel = {
        id: newNodeId,
        position: { x: position.x, y: position.y },
        ports: ports,
        parentId: null,
        type: event.type,
        data: event.data,
        size: { width: 600, height: 400 },
        color: nodeColor,
        icon: nodeIcon,
        node_name: newNodeName,
        collapsed: false,
        expandedSize: { width: 600, height: 400 },
        input_map: {}, // Empty object as default
        output_variable_path: null, // null as default
      };
      this.flowService.addGroup(newNode);
    } else {
      // Create the new node, including the generated node_name.
      const newNode: NodeModel = {
        id: newNodeId,
        position: { x: position.x, y: position.y },
        ports: ports,
        parentId: null,
        type: event.type,
        data: event.data,
        color: nodeColor,
        icon: nodeIcon,
        node_name: newNodeName,
        input_map: {}, // Empty object as default
        output_variable_path: null, // null as default
      };

      this.flowService.addNode(newNode);
    }
  }
  // side panel logic
  onEditNode(node: NodeModel): void {
    // Open the side panel by setting selectedNode.
    this.selectedNode = node;
  }
  onCloseSidePanel(): void {
    this.selectedNode = null;
  }
  onNodeUpdated(updated: NodeModel): void {
    console.log('Node updated:', updated);
    this.flowService.updateNode(updated);
    this.selectedNode = null; // close or reset selection
  }

  //group logic
  startEditingGroup(group: GroupNodeModel): void {
    this.editedGroupId = group.id;
    this.editGroupName = group.data;
  }

  saveGroupName(group: GroupNodeModel): void {
    // Update in FlowService (in place, without triggering global change detection)
    this.undoRedoService.stateChanged();
    this.flowService.updateGroupName(group.id, this.editGroupName);

    // Record undo state

    // Exit edit mode
    this.editedGroupId = null;
    this.editGroupName = '';
  }
  toggleGroupExpansion(group: GroupNodeModel): void {
    this.undoRedoService.stateChanged();

    const newCollapsed = !group.collapsed;

    // Find all child nodes belonging to this group
    const childNodes: NodeModel[] = this.flowService
      .getFlowState()
      .nodes.filter((node) => node.parentId === group.id);

    if (newCollapsed) {
      // Store the current (expanded) size before collapsing
      group.expandedSize = { ...group.size };

      // Store each child node's offset relative to the group's position
      childNodes.forEach((node) => {
        node.relativePosition = {
          x: node.position.x - group.position.x,
          y: node.position.y - group.position.y,
        };
      });

      // Set collapsed height and width
      group.size = {
        width: group.size.width,
        height: 50,
      };

      // Collapse connections: remove child-node connections and add group-level connections.
      this.flowService.collapseGroupConnections(group);
    } else {
      // Restore the previously stored expanded size
      group.size = { ...group.expandedSize };

      // Restore each child node's absolute position using the stored offset
      childNodes.forEach((node) => {
        if (node.relativePosition) {
          node.position = {
            x: group.position.x + node.relativePosition.x,
            y: group.position.y + node.relativePosition.y,
          };
        }
      });

      // Expand connections: remove group-level connections and restore original ones.
      this.flowService.expandGroupConnections(group);
    }

    // Update the collapsed state immutably (if possible, update via flowService)
    group.collapsed = newCollapsed;
    this.flowService.updateGroupCollapsed(group.id, newCollapsed);
  }
  protected viewModel: {
    scale: number | undefined;
    position: { x: number; y: number } | undefined;
  } = {
    scale: undefined,
    position: undefined,
  };
  public onProjectExpandToggle(node: NodeModel) {
    console.log(this.fCanvasComponent.getScale());

    // First call
    this.fCanvasComponent.centerGroupOrNode(node.id, true);
    this.fCanvasComponent.setScale(2.15);
    this.fCanvasComponent.redrawWithAnimation();

    // Second call with a delay (e.g., 500ms)
    setTimeout(() => {
      console.log('Second call with delay');
      this.fCanvasComponent.setScale(2.15);
      this.fCanvasComponent.redrawWithAnimation();
      this.fCanvasComponent.centerGroupOrNode(node.id, true);
      this.emitFlowStateData();
    }, 0);
  }

  private emitFlowStateData(): void {
    // Get the current flow state
    const flowState = this.flowService.getFlowState();

    // Get the undo/redo stack
    const undoStack = this.undoRedoService.getUndoStack();
    const redoStack = this.undoRedoService.getRedoStack();

    // Get the clipboard data
    const clipboardData = this.clipboardService.getClipboardData(); // Assuming flowId is unique
    // Prepare the data to emit
    const flowStateData: FlowStateData = {
      flowState,
      undoStack,
      redoStack,
      clipboardData,
    };
    console.log(flowStateData);

    // Emit the data to the parent component
    this.graphDataEmitted.emit(flowStateData);
  }
}
