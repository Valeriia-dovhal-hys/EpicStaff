import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  GraphSessionStatus,
  GraphSession,
  GraphSessionService,
} from '../../../../../services/graph-sessions-status.service';
import { ToastService } from '../../../../../services/notifications/toast.service';

type StatusFilter = 'all' | GraphSessionStatus;

export interface GraphSessionsDialogData {
  graphId: number;
  graphName: string;
  initialFilter?: StatusFilter;
}

@Component({
  selector: 'app-graph-sessions-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-sessions-dialog.component.html',
  styleUrls: ['./graph-sessions-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphSessionsDialogComponent implements OnInit, OnDestroy {
  public sessions: GraphSession[] = [];
  public filteredSessions: GraphSession[] = [];
  public isLoading = true;
  public GraphSessionStatus = GraphSessionStatus; // Make enum available in template
  public activeFilter: StatusFilter = 'all';
  public statusCounts = {
    all: 0,
    [GraphSessionStatus.RUNNING]: 0,
    [GraphSessionStatus.ENDED]: 0,
    [GraphSessionStatus.WAITING_FOR_USER]: 0,
    [GraphSessionStatus.ERROR]: 0,
  };

  private subscriptions = new Subscription();

  constructor(
    @Inject(DIALOG_DATA) public data: GraphSessionsDialogData,
    private dialogRef: DialogRef<void>,
    private sessionService: GraphSessionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchSessions();
  }

  private fetchSessions(): void {
    this.isLoading = true;

    const sessionsSub = this.sessionService
      .getSessionsByGraphId(this.data.graphId)
      .subscribe({
        next: (sessions) => {
          // Sort sessions by creation date (newest first)
          this.sessions = sessions.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          // Calculate status counts
          this.calculateStatusCounts();

          // Use the initialFilter if provided, otherwise default to 'all'
          this.applyFilter(this.data.initialFilter || 'all');

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching sessions:', error);
          this.toastService.error(
            `Failed to load sessions: ${error.message || 'Unknown error'}`
          );
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });

    this.subscriptions.add(sessionsSub);
  }

  private calculateStatusCounts(): void {
    // Reset counts
    this.statusCounts = {
      all: this.sessions.length,
      [GraphSessionStatus.RUNNING]: 0,
      [GraphSessionStatus.ENDED]: 0,
      [GraphSessionStatus.WAITING_FOR_USER]: 0,
      [GraphSessionStatus.ERROR]: 0,
    };

    // Count sessions by status
    this.sessions.forEach((session) => {
      if (session.status in this.statusCounts) {
        this.statusCounts[session.status as GraphSessionStatus]++;
      }
    });
  }

  public applyFilter(filter: StatusFilter): void {
    this.activeFilter = filter;

    if (filter === 'all') {
      this.filteredSessions = [...this.sessions];
    } else {
      this.filteredSessions = this.sessions.filter(
        (session) => session.status === filter
      );
    }

    this.cdr.markForCheck();
  }

  public viewSession(session: GraphSession): void {
    this.dialogRef.close();
    this.router.navigate(['/graph', this.data.graphId, 'session', session.id]);
  }

  public getStatusLabel(status: GraphSessionStatus): string {
    switch (status) {
      case GraphSessionStatus.RUNNING:
        return 'Running';
      case GraphSessionStatus.ERROR:
        return 'Error';
      case GraphSessionStatus.ENDED:
        return 'Completed';
      case GraphSessionStatus.WAITING_FOR_USER:
        return 'Waiting for Input';
      default:
        return 'Unknown';
    }
  }

  public getStatusClass(status: GraphSessionStatus): string {
    switch (status) {
      case GraphSessionStatus.RUNNING:
        return 'status-running';
      case GraphSessionStatus.ERROR:
        return 'status-error';
      case GraphSessionStatus.ENDED:
        return 'status-completed';
      case GraphSessionStatus.WAITING_FOR_USER:
        return 'status-waiting';
      default:
        return '';
    }
  }

  public getFilterClass(filter: StatusFilter): string {
    let baseClass = '';

    if (filter !== 'all') {
      baseClass = this.getStatusClass(filter);
    }

    return this.activeFilter === filter ? `${baseClass} active` : baseClass;
  }

  public formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  public close(): void {
    this.dialogRef.close();
  }

  getStatusIcon(status: GraphSessionStatus): string {
    switch (status) {
      case GraphSessionStatus.RUNNING:
        return 'ti ti-player-play';
      case GraphSessionStatus.WAITING_FOR_USER:
        return 'ti ti-hourglass';
      case GraphSessionStatus.ENDED:
        return 'ti ti-check';
      case GraphSessionStatus.ERROR:
        return 'ti ti-alert-triangle';
      default:
        return 'ti ti-circle';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
