import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlowService } from '../../../../visual-programming/services/flow.service';
import { GraphService } from '../../services/graphs.service';
import {
  CreateGraphDtoRequest,
  GraphDto,
  UpdateGraphDtoRequest,
} from '../../models/graph.model';
import { FlowHeaderComponent } from './components/header/flow-header.component';
import { FlowGraphComponent } from '../../../../visual-programming/flow-graph/flow-graph.component';
import {
  catchError,
  EMPTY,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';

import { ConditionalEdgeService } from './services/conditional-edge.service';
import { CrewNodeService } from './services/crew-node.service';
import { EdgeService } from './services/edge.service';
import { PythonNodeService } from './services/python-node.service';

import {
  ConditionalEdge,
  CreateConditionalEdgeRequest,
  CustomConditionalEdgeModelForNode,
  GetConditionalEdgeRequest,
} from './models/conditional-edge.model';
import { CreateEdgeRequest, Edge } from './models/edge.model';
import { GetProjectRequest } from '../../../projects-page/models/project.model';

import { CreateCrewNodeRequest, CrewNode } from './models/crew-node.model';
import {
  CreatePythonNodeRequest,
  PythonNode,
} from './models/python-node.model';

import { v4 as uuidv4 } from 'uuid';
import { SharedSnackbarService } from '../../../../services/snackbar/shared-snackbar.service';
import { ConnectionModel } from '../../../../visual-programming/core/models/connection.model';
import { FlowModel } from '../../../../visual-programming/core/models/flow.model';
import { GroupModel } from '../../../../visual-programming/core/models/group.model';
import { NodeModel } from '../../../../visual-programming/core/models/node.model';
import { GraphUpdateService } from '../../../../visual-programming/services/graph/save-graph.service';

export interface FlowState {
  nodes: NodeModel[];
  connections: ConnectionModel[];
  groups: GroupModel[];
}
@Component({
  selector: 'app-flow-visual-programming',
  standalone: true,
  imports: [FlowHeaderComponent, FlowGraphComponent],
  templateUrl: './flow-visual-programming.component.html',
  styleUrl: './flow-visual-programming.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowVisualProgrammingComponent implements OnInit, OnDestroy {
  graph!: GraphDto;
  private destroy$ = new Subject<void>();

  isLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private graphService: GraphService,
    private flowService: FlowService,
    private cdr: ChangeDetectorRef,

    private snackbarService: SharedSnackbarService,
    private graphUpdateService: GraphUpdateService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      console.warn('Invalid graph ID.');
      return;
    }

    this.fetchGraph(id);
  }

  private fetchGraph(graphId: number): void {
    this.graphService
      .getGraphById(graphId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (graph: GraphDto) => {
          this.graph = graph;
          console.log('metadata', this.graph.metadata);
          this.isLoaded = true;
          console.log(this.graph);

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching graph:', err);
        },
      });
  }

  public handleSaveFlow(): void {
    const flowState: FlowModel = this.flowService.getFlowState();
    this.graphUpdateService
      .saveGraph(flowState, this.graph)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.graph = result.graph;
        },
        error: (err) => {},
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
