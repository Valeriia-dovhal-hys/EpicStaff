import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  GraphDto,
  CreateGraphDtoRequest,
  UpdateGraphDtoRequest,
} from './models/graph.model';
import { GraphService } from './services/graphs.service';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import {
  FlowItemComponent,
  SessionViewRequest,
} from './components/flow-item/flow-item.component';
import { CreateFlowDialogComponent } from './components/flow-dialog/create-flow-dialog.component';

import { Subscription, forkJoin, interval } from 'rxjs';
import { finalize, switchMap, takeWhile } from 'rxjs/operators';

import { Dialog } from '@angular/cdk/dialog';
import { GraphSessionsDialogComponent } from './components/flow-item/graph-sesions-dialog/graph-sessions-dialog.component';
import { PageHeaderComponent } from '../../shared/components/header/page-header.component';
import {
  GraphSession,
  GraphSessionService,
  GraphSessionStatus,
} from '../../services/graph-sessions-status.service';
import { ToastService } from '../../services/notifications/toast.service';
import { RunGraphService } from '../../services/run-graph-session.service';
import { ConfirmationDialogService } from '../../shared/components/cofirm-dialog/confimation-dialog.service';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

interface GraphWithSessionsInfo extends GraphDto {
  activeSessionsCount: number;
  waitingForUserSessionsCount: number;
}

@Component({
  selector: 'app-flows-page',
  standalone: true,
  templateUrl: './flows-page.component.html',
  styleUrls: ['./flows-page.component.scss'],
  imports: [
    NgIf,
    FlowItemComponent,
    NgFor,
    PageHeaderComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsPageComponent implements OnInit, OnDestroy {
  public graphs: GraphWithSessionsInfo[] = []; // Local array for graphs with sessions info
  public graphCount: number = 0;
  public isLoading = signal<boolean>(true);
  private subscriptions = new Subscription();
  private sessions: GraphSession[] = [];
  private pollingSubscription?: Subscription;
  private hasActiveSessions: boolean = false;
  private readonly POLLING_INTERVAL = 2000; // 2 seconds

  constructor(
    private graphsService: GraphService,
    private sessionService: GraphSessionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: Dialog, // Changed from MatDialog to Dialog
    private toastService: ToastService,
    private confirmationService: ConfirmationDialogService,
    private runGraphService: RunGraphService
  ) {}

  ngOnInit(): void {
    this.fetchGraphsAndSessions();
  }

  private fetchGraphsAndSessions(): void {
    // Record start time for minimum loading duration
    const loadStartTime = Date.now();

    // Use forkJoin to fetch both graphs and sessions in parallel
    forkJoin({
      graphs: this.graphsService.getGraphs(),
      sessions: this.sessionService.getAllSessions(),
    })
      .pipe(
        finalize(() => {
          // Ensure minimum loading time of 500ms
          const loadTime = Date.now() - loadStartTime;
          const remainingTime = Math.max(0, 500 - loadTime);

          setTimeout(() => {
            this.isLoading.set(false);
            this.cdr.markForCheck();
          }, remainingTime);
        })
      )
      .subscribe({
        next: (results) => {
          // Check if sessions is actually an array
          if (results.sessions && Array.isArray(results.sessions)) {
            this.sessions = results.sessions;
          } else if (
            results.sessions &&
            typeof results.sessions === 'object' &&
            'results' in results.sessions
          ) {
            // Handle case where API returns a paginated response with results property
            this.sessions = (results.sessions as any).results;
          } else {
            // Handle unexpected response format
            console.error(
              'Unexpected sessions response format:',
              results.sessions
            );
            this.sessions = [];
            this.toastService.error('Error processing session data');
          }

          // Calculate session counts for all graphs in one pass
          const sessionCountsMap = this.calculateSessionCountsByGraph(
            this.sessions
          );

          // Map graphs to GraphWithSessionsInfo
          this.graphs = results.graphs
            .sort((a, b) => b.id - a.id)
            .map((graph) =>
              this.addSessionsInfoToGraph(graph, sessionCountsMap)
            );

          this.graphCount = this.graphs.length;

          // Check if there are any active sessions
          this.checkAndHandleActiveSessions();

          // Mark component for change detection
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.toastService.error('Failed to fetch flows or sessions');
        },
      });
  }
  /**
   * Checks if there are any active sessions and starts or stops polling accordingly
   */
  private checkAndHandleActiveSessions(): void {
    // Check if there are any active or waiting sessions across all graphs
    const hasActive = this.graphs.some(
      (graph) =>
        graph.activeSessionsCount > 0 || graph.waitingForUserSessionsCount > 0
    );

    if (hasActive && !this.hasActiveSessions) {
      // We have active sessions but polling isn't running - start it
      this.hasActiveSessions = true;
      this.startPolling();
    } else if (!hasActive && this.hasActiveSessions) {
      // No active sessions but polling is running - stop it
      this.hasActiveSessions = false;
      this.stopPolling();
    }
  }

  /**
   * Starts polling for session updates every 2 seconds
   */
  private startPolling(): void {
    console.log('Starting session polling...');

    // Stop any existing polling
    this.stopPolling();

    // Create a new polling subscription
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        // Convert each interval tick to a request for session data
        switchMap(() => this.sessionService.getAllSessions())
      )
      .subscribe({
        next: (sessions) => {
          // Update session data
          if (Array.isArray(sessions)) {
            this.sessions = sessions;
          } else if (
            sessions &&
            typeof sessions === 'object' &&
            'results' in sessions
          ) {
            this.sessions = (sessions as any).results;
          }

          // Recalculate session counts
          const sessionCountsMap = this.calculateSessionCountsByGraph(
            this.sessions
          );

          // Update session counts for each graph
          let graphsChanged = false;
          this.graphs.forEach((graph) => {
            const counts = sessionCountsMap.get(graph.id) || {
              activeCount: 0,
              waitingCount: 0,
            };

            // Only trigger change detection if counts have changed
            if (
              graph.activeSessionsCount !== counts.activeCount ||
              graph.waitingForUserSessionsCount !== counts.waitingCount
            ) {
              graph.activeSessionsCount = counts.activeCount;
              graph.waitingForUserSessionsCount = counts.waitingCount;
              graphsChanged = true;
            }
          });

          // Check if we should continue polling
          this.checkAndHandleActiveSessions();

          // Only trigger change detection if data has changed
          if (graphsChanged) {
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('Error polling session data:', error);
          // Continue polling even on error
        },
      });

    // Add to our subscriptions for proper cleanup
    this.subscriptions.add(this.pollingSubscription);
  }

  /**
   * Stops the session polling
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      console.log('Stopping session polling...');
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  private calculateSessionCountsByGraph(
    sessions: GraphSession[]
  ): Map<number, { activeCount: number; waitingCount: number }> {
    const sessionCountsMap = new Map<
      number,
      { activeCount: number; waitingCount: number }
    >();

    if (!sessions || !Array.isArray(sessions)) {
      console.error('Sessions is not an array:', sessions);
      return sessionCountsMap;
    }

    // Process all sessions in a single loop
    sessions.forEach((session) => {
      if (!session || !session.graph || typeof session.graph.id !== 'number') {
        console.warn('Invalid session object:', session);
        return; // Skip this iteration
      }

      const graphId = session.graph.id;

      // Initialize counts for this graph if not already present
      if (!sessionCountsMap.has(graphId)) {
        sessionCountsMap.set(graphId, { activeCount: 0, waitingCount: 0 });
      }

      const counts = sessionCountsMap.get(graphId)!;

      // Increment the appropriate counter based on session status
      if (session.status === GraphSessionStatus.RUNNING) {
        counts.activeCount++;
      } else if (session.status === GraphSessionStatus.WAITING_FOR_USER) {
        counts.waitingCount++;
      }
    });

    return sessionCountsMap;
  }

  private addSessionsInfoToGraph(
    graph: GraphDto,
    sessionCountsMap: Map<number, { activeCount: number; waitingCount: number }>
  ): GraphWithSessionsInfo {
    // Get counts from map or use zeros if not found
    const counts = sessionCountsMap.get(graph.id) || {
      activeCount: 0,
      waitingCount: 0,
    };

    return {
      ...graph,
      activeSessionsCount: counts.activeCount,
      waitingForUserSessionsCount: counts.waitingCount,
    };
  }

  public openCreateFlowDialog(): void {
    const dialogRef = this.dialog.open(CreateFlowDialogComponent, {
      width: '450px',
      panelClass: 'custom-dialog-container',
      data: {
        isEdit: false,
      },
    });

    dialogRef.closed.subscribe((result: any) => {
      if (result) {
        const newGraph: CreateGraphDtoRequest = {
          name: result.name || '', // Add fallback in case of undefined
          description: result.description || '', // Handle optional description
          entry_point: null, // Adjust as needed
          metadata: {
            nodes: [],
            connections: [],
            groups: [],
          },
        };

        this.graphsService.createGraph(newGraph).subscribe({
          next: (createdGraph) => {
            const graphWithSessions: GraphWithSessionsInfo = {
              ...createdGraph,
              activeSessionsCount: 0,
              waitingForUserSessionsCount: 0,
            };

            this.graphs = [graphWithSessions, ...this.graphs];
            this.graphCount = this.graphs.length;
            this.toastService.success(
              `Flow "${newGraph.name}" has been created`
            );
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error creating flow:', error);
            this.toastService.error(
              `Failed to create flow: ${error.message || 'Unknown error'}`
            );
            this.cdr.markForCheck();
          },
        });
      }
    });
  }

  public onEditFlow(selectedGraph: GraphWithSessionsInfo): void {
    const dialogRef = this.dialog.open(CreateFlowDialogComponent, {
      width: '450px',
      panelClass: 'custom-dialog-container',
      data: {
        isEdit: true,
        flow: selectedGraph,
      },
    });

    dialogRef.closed.subscribe((result: any) => {
      if (result) {
        const updatedGraph: UpdateGraphDtoRequest = {
          id: result.id,
          name: result.name,
          description: result.description || '',
          entry_point: result.entry_point,
          metadata: result.metadata,
        };

        this.graphsService.updateGraph(updatedGraph).subscribe({
          next: (updatedGraphResponse) => {
            // Update the graph in the array while preserving session info
            this.graphs = this.graphs.map((graph) =>
              graph.id === updatedGraphResponse.id
                ? {
                    ...updatedGraphResponse,
                    activeSessionsCount: graph.activeSessionsCount,
                    waitingForUserSessionsCount:
                      graph.waitingForUserSessionsCount,
                  }
                : graph
            );

            this.toastService.success(
              `Flow "${updatedGraph.name}" has been updated`
            );
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error updating flow:', error);
            this.toastService.error(
              `Failed to update flow: ${error.message || 'Unknown error'}`
            );
            this.cdr.markForCheck();
          },
        });
      }
    });
  }

  public onOpenFlow(selectedGraph: GraphWithSessionsInfo): void {
    console.log('Selected Graph', selectedGraph);
    this.router.navigate(['/flows', selectedGraph.id], {
      state: { graph: selectedGraph },
    });
  }

  public onDeleteFlow(selectedGraph: GraphWithSessionsInfo): void {
    this.confirmationService
      .confirmDelete(selectedGraph.name)
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          // Show loading state if needed
          const deleteSubscription = this.graphsService
            .deleteGraph(selectedGraph.id)
            .subscribe({
              next: () => {
                // Remove the graph from the list
                this.graphs = this.graphs.filter(
                  (graph) => graph.id !== selectedGraph.id
                );
                this.graphCount = this.graphs.length;

                this.toastService.success(
                  `Flow "${selectedGraph.name}" has been deleted`
                );

                // Check if we need to stop polling
                this.checkAndHandleActiveSessions();

                // Update the UI
                this.cdr.markForCheck();
              },
              error: (error) => {
                console.error('Error deleting flow:', error);

                // Show error message with the toast service
                this.toastService.error(
                  `Failed to delete flow: ${error.message || 'Unknown error'}`
                );
                this.cdr.markForCheck();
              },
            });

          this.subscriptions.add(deleteSubscription);
        }
      });
  }

  public onPlayFlow(selectedGraph: GraphWithSessionsInfo): void {
    const runSubscription = this.runGraphService
      .runGraph(selectedGraph.id)
      .subscribe({
        next: (response) => {
          // Navigate to the running graph session
          this.router.navigate([
            '/graph',
            selectedGraph.id,
            'session',
            response.session_id,
          ]);

          // Update the session counts
          selectedGraph.activeSessionsCount++;

          // Check if we need to start polling
          this.checkAndHandleActiveSessions();

          this.toastService.success(
            `Flow "${selectedGraph.name}" started successfully`
          );
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error running flow:', error);

          this.toastService.error(
            `Failed to start flow: ${error.message || 'Unknown error'}`
          );
          this.cdr.markForCheck();
        },
      });

    this.subscriptions.add(runSubscription);
  }

  public onViewSessions(request: SessionViewRequest): void {
    const { graph, filterStatus } = request;

    const dialogRef = this.dialog.open(GraphSessionsDialogComponent, {
      backdropClass: 'dark-blur-backdrop',
      data: {
        graphId: graph.id,
        graphName: graph.name,
        initialFilter: filterStatus || 'all',
      },
    });

    dialogRef.closed.subscribe(() => {});
  }
  // Track by function for ngFor optimization
  trackByGraphId(index: number, graph: GraphWithSessionsInfo): number {
    return graph.id;
  }

  ngOnDestroy(): void {
    // Make sure to stop polling
    this.stopPolling();
    this.subscriptions.unsubscribe();
  }
}
