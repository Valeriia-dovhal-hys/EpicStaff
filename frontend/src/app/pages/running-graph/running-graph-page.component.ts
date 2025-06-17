import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { GraphMessagesComponent } from './components/graph-messages/graph-messages.component';
import { RunningGraphHeaderComponent } from './components/header/run-graph-header.component';
import { FlowRepresentationComponent } from './components/graph-reprsentation/graph-representation.component';
import { GraphSessionStatus } from '../../services/graph-sessions-status.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GraphMessage } from './components/graph-messages/graph-session-message.model';
import { GraphDto } from '../flows-page/models/graph.model';
import { GraphService } from '../flows-page/services/graphs.service';

@Component({
  selector: 'app-running-graph',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    RunningGraphHeaderComponent,
    GraphMessagesComponent,
    FlowRepresentationComponent,
  ],
  template: `
    <div class="running-graph-container">
      <app-running-graph-header
        [graphId]="graphId"
        [sessionId]="sessionId"
        [graphName]="graphData?.name"
        [sessionStatus]="currentSessionStatus"
      >
      </app-running-graph-header>

      <div class="content-container">
        <div class="flow-representation-container">
          <app-flow-representation
            [graphData]="graphData"
            [messages]="messages"
          >
          </app-flow-representation>
        </div>
        <div class="flow-messages-container">
          <app-graph-messages
            [sessionId]="sessionId"
            (sessionStatusChanged)="handleSessionStatusChange($event)"
            (messagesChanged)="handleMessagesChanged($event)"
          >
          </app-graph-messages>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .running-graph-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .content-container {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      .flow-representation-container {
        flex: 1;
        padding-inline: 3.8rem;
        min-width: 350px;
        overflow: auto;
        border-right: 1px solid var(--gray-800);
      }
      .flow-messages-container {
        flex: 5;
        overflow-y: auto;
        overflow-x: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunningGraphComponent implements OnInit, OnDestroy {
  graphId: string | null | undefined = null;
  sessionId: string | null = null;
  graphData: GraphDto | null = null;
  currentSessionStatus: GraphSessionStatus | null = null;
  messages: GraphMessage[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private graphService: GraphService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Extract graphId and sessionId from route parameters
    this.route.paramMap.subscribe((params) => {
      this.graphId = params.get('graphId');
      this.sessionId = params.get('sessionId');

      // Fetch graph data if we have a graphId
      if (this.graphId) {
        this.loadGraphData(+this.graphId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGraphData(graphId: number): void {
    this.graphService
      .getGraphById(graphId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (graph) => {
          this.graphData = graph;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load graph data:', err);
          this.cdr.markForCheck();
        },
      });
  }

  handleSessionStatusChange(status: GraphSessionStatus): void {
    console.log('Session status changed:', status);
    this.currentSessionStatus = status;
    this.cdr.markForCheck();
  }

  handleMessagesChanged(newMessages: GraphMessage[]): void {
    console.log('Received new messages:', newMessages);
    this.messages = newMessages;
    this.cdr.markForCheck();
  }
}
