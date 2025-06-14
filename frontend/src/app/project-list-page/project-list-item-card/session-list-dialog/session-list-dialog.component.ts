import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  RunCrewSessionService,
  Session,
} from '../../../services/run-crew-session.service';
import { MatListModule } from '@angular/material/list';
import { NgForOf, DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Project } from '../../../shared/models/project.model';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmStopDialogComponent } from './confirm-run-dialog/confirm-stop-dialog.component';

@Component({
  selector: 'app-session-list-dialog',
  templateUrl: './session-list-dialog.component.html',
  styleUrls: ['./session-list-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    NgForOf,
    DatePipe,
  ],
})
export class SessionListDialogComponent {
  private sessions: Session[];
  project: Project;
  selectedStatus: string = 'all';

  statusLabels: { [key: string]: string } = {
    run: 'Active',
    end: 'Finished',
    error: 'Error',
  };

  constructor(
    public dialogRef: MatDialogRef<SessionListDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { sessions: Session[]; project: Project },
    private router: Router,
    private runCrewSessionService: RunCrewSessionService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.sessions = data.sessions.sort((a, b) => b.id - a.id);
    this.project = data.project;
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.cdr.markForCheck();
  }

  get filteredSessions(): Session[] {
    if (this.selectedStatus === 'all') {
      return this.sessions;
    } else {
      return this.sessions.filter(
        (session) => session.status === this.selectedStatus
      );
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onViewSession(session: Session): void {
    if (this.project && session) {
      this.router.navigate([
        `/project/${this.project.id}/run-session/${session.id}`,
      ]);
      this.dialogRef.close();
    } else {
      console.error('Project or Session data is missing.');
    }
  }

  onStopSession(session: Session): void {
    if (session.status === 'run') {
      const dialogRef = this.dialog.open(ConfirmStopDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirm Stop',
          message:
            "By pressing Stop, you won't be able to continue the project session.",
          confirmButtonText: 'Stop',
          cancelButtonText: 'Close',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          this.runCrewSessionService.stopSession(session.id).subscribe({
            next: () => {
              session.status = 'end';
              this.cdr.markForCheck();
              console.log(`Session ${session.id} successfully stopped.`);
            },
            error: (error) => {
              console.error(`Failed to stop session ${session.id}:`, error);
            },
          });
        } else {
          // User cancelled the stop action
          console.log(`Session ${session.id} stop cancelled.`);
        }
      });
    }
  }
}
