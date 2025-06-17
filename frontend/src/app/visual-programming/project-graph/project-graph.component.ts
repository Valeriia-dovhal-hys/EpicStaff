import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
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
} from '@foblex/flow';
import { IPoint, IRect, Point, PointExtensions } from '@foblex/2d';

import { FlowService } from '../services/flow.service';

import { ActivatedRoute } from '@angular/router';
import { ShortcutListenerDirective } from '../core/directives/shortcut-listener.directive';
import { UndoRedoService } from '../services/undo-redo.service';
import { ClipboardService } from '../services/clipboard.service';
import { MouseTrackerDirective } from '../core/directives/mouse-tracker.directive';
import { debounceTime, Subject } from 'rxjs';
import { NodeModel } from '../core/models/node.model';
import { ConnectionModel } from '../core/models/connection.model';
import { v4 as uuidv4 } from 'uuid';

import { CustomPortId } from '../core/models/port.model';
import {
  isConnectionValid,
  defineSourceTargetPair,
} from '../core/helpers/helpers';
import { NgIf } from '@angular/common';
import { NodeType } from '../core/enums/node-type';
import { generatePortsForNode } from '../core/helpers/helpers';
import { FlowBaseNodeComponent } from '../components/flow-base-node/flow-base-node.component';

@Component({
  selector: 'app-project-graph',
  templateUrl: './project-graph.component.html',
  styleUrls: ['../styles/_variables.scss', './project-graph.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  //   providers: [FlowService],
  imports: [
    FZoomDirective,
    FFlowModule,
    FlowBaseNodeComponent,
    ShortcutListenerDirective,
    MouseTrackerDirective,
  ],
})
export class ProjectGraphComponent implements OnInit {
  @ViewChild(FFlowComponent, { static: false })
  public fFlowComponent!: FFlowComponent;

  @ViewChild(FCanvasComponent, { static: false })
  public fCanvasComponent!: FCanvasComponent;

  @ViewChild(FZoomDirective, { static: false })
  public fZoomDirective!: FZoomDirective;
  protected readonly eMarkerType = EFMarkerType;

  public isLoaded: boolean = false;
  public currentMouseTrackerPosition: { x: number; y: number } = { x: 0, y: 0 };
  public showContextMenu = signal(false);
  public contextMenuMousePosition = signal<IPoint>(
    PointExtensions.initialize(0, 0)
  );

  constructor(
    private route: ActivatedRoute,
    public flowService: FlowService,
    private undoRedoService: UndoRedoService,
    private clipboardService: ClipboardService,
    private cd: ChangeDetectorRef
  ) {}
  public ngOnInit(): void {
    const projectId: string | null =
      this.route.snapshot.paramMap.get('projectId');
    // this.headerStateService.setProjectName(projectName);
    if (projectId) {
      this.flowService.fetchFlow(projectId).subscribe((flow) => {
        this.flowService.setFlow(flow);
      });
      this.isLoaded = true;
      this.cd.markForCheck();
    }
  }
  ngDoCheck() {
    console.log('PERFORMANCE!');
  }
  public onInitialized(): void {
    // this.fCanvasComponent.fitToScreen(new Point(40, 40), false);
  }
  public updateMouseTrackerPosition(event: { x: number; y: number }) {
    this.currentMouseTrackerPosition = event;
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
    const newConnection: ConnectionModel = {
      id: `${event.fOutputId}+${event.newFInputId}`,
      sourceNodeId: oldConnection.sourceNodeId,
      targetNodeId: newTargetNodeId,
      sourcePortId: event.fOutputId as CustomPortId,
      targetPortId: event.newFInputId as CustomPortId,
    };
    console.log(newConnection);

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

    // Create the new connection object based on your models
    const newConnection: ConnectionModel = {
      id: newConnectionId,
      sourceNodeId: pair.sourcePortId.split('_')[0], // Extract sourceNodeId from portId
      targetNodeId: pair.targetPortId.split('_')[0], // Extract targetNodeId from portId
      sourcePortId: pair.sourcePortId as CustomPortId,
      targetPortId: pair.targetPortId as CustomPortId,
    };

    // Add the new connection to the flow service
    this.flowService.addConnection(newConnection);
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

    if (this.currentMouseTrackerPosition) {
      pastePosition = this.fFlowComponent.getPositionInFlow(
        PointExtensions.initialize(
          this.currentMouseTrackerPosition.x,
          this.currentMouseTrackerPosition.y
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

    console.log(this.flowService.getFlowState());

    this.fFlowComponent.select(newNodeIds, newConnectionIds);

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
    const selections = this.fFlowComponent.getSelection();
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
    console.log('context menu');

    this.contextMenuMousePosition.set(
      this.fFlowComponent.getPositionInFlow(
        PointExtensions.initialize(event.clientX, event.clientY)
      )
    );

    this.showContextMenu.set(true);
  }
  public onClose(): void {
    this.showContextMenu.set(false);
  }

  //   public onBlockAction(block: { type: NodeType; data?: any }): void {
  //     console.log('Block action:', block);
  //     this.showContextMenu.set(false);

  //     // Generate a new node id using UUID.
  //     const newNodeId = uuidv4();
  //     // Get the position from the context menu mouse position.
  //     const position = this.contextMenuMousePosition();

  //     // Generate ports based on the new node id and the node type.
  //     const ports = generatePortsForNode(newNodeId, block.type);

  //     // Create the new node model.
  //     const newNode: NodeModel = {
  //       id: newNodeId,
  //       position: { x: position.x, y: position.y },
  //       ports: ports,
  //       parentId: null,
  //       type: block.type,
  //       data: block.data,
  //       node_name: 'logic will be implemented...',
  //     };

  //     // Add the new node to the flow state.
  //     this.flowService.addNode(newNode);
  //   }

  public onSave(): void {
    console.log(
      'Saving current flow:',
      this.flowService.nodes(),
      this.flowService.connections()
    );
  }
}
