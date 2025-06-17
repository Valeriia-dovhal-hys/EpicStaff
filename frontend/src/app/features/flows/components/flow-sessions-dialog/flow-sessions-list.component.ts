import {
  Component,
  OnInit,
  Inject,
  signal,
  ChangeDetectionStrategy,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { GraphDto } from '../../models/graph.model';
import {
  GraphSession,
  GraphSessionService,
  GraphSessionStatus,
} from '../../services/flows-sessions.service';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { CheckboxComponent } from '../../../../shared/components/form-controls/checkbox/checkbox.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { FlowSessionsTableComponent } from './flow-sessions-table.component';

@Component({
  selector: 'app-flow-sessions-list',
  templateUrl: './flow-sessions-list.component.html',
  styleUrls: ['./flow-sessions-list.component.scss'],
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FlowSessionsTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowSessionsListComponent implements OnInit {
  public flow!: GraphDto;
  public sessions = signal<GraphSession[]>([]);
  public isLoaded = signal<boolean>(false);
  @ViewChild('sessionSearchInput')
  sessionSearchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private graphSessionService: GraphSessionService,
    @Inject(DIALOG_DATA) public data: { flow: GraphDto },
    private router: Router,
    public dialogRef: DialogRef<unknown>
  ) {
    this.flow = data.flow;
  }

  public ngOnInit(): void {
    this.loadSessions();
  }

  private loadSessions(): void {
    this.isLoaded.set(false);
    if (this.flow && this.flow.id) {
      this.graphSessionService.getSessionsByGraphId(this.flow.id).subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.isLoaded.set(true);
        },
        error: () => {
          this.sessions.set([]);
          this.isLoaded.set(true);
        },
      });
    } else {
      this.isLoaded.set(true);
    }
  }

  public onDeleteSelected(ids: number[]): void {
    if (ids.length === 0) return;
    this.graphSessionService.bulkDeleteSessions(ids).subscribe({
      next: () => {
        this.sessions.update((sessions) =>
          sessions.filter((s) => !ids.includes(s.id))
        );
      },
      error: (err) => {
        console.error('Failed to bulk delete sessions', err);
      },
    });
  }

  public onViewSession(sessionId: number): void {
    // Always use router navigation to ensure route parameter subscriptions fire
    this.router.navigate(['/graph', this.flow.id, 'session', sessionId]);
    this.dialogRef.close();
  }

  public onStopSession(sessionId: number): void {
    this.graphSessionService.stopSessionById(sessionId).subscribe({
      next: (response) => {
        this.sessions.update((sessions) =>
          sessions.map((s) =>
            s.id === sessionId ? { ...s, status: GraphSessionStatus.ENDED } : s
          )
        );
        console.log('Session stopped', sessionId, response);
      },
      error: (err) => {
        console.error('Failed to stop session', err);
      },
    });
  }

  public ngOnDestroy() {
    this.sessions.set([]);
  }
}
