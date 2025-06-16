import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { Project } from '../../shared/models/project.model';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  RunCrewSessionService,
  Session,
} from '../../services/run-crew-session.service';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RunCrewSessionRequest } from '../../shared/models/RunCrewSession.model';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { SessionListDialogComponent } from './session-list-dialog/session-list-dialog.component';

@Component({
  selector: 'app-project-list-item-card',
  templateUrl: './project-list-item-card.component.html',
  styleUrls: ['./project-list-item-card.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    NgIf,
  ],
})
export class ProjectListItemCardComponent {
  @Input() project!: Project;
  @Output() deleteProject = new EventEmitter<number>();

  @ViewChild('confirmRunDialog') confirmRunDialog!: TemplateRef<any>;

  runSessionId: number | null = null;

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private runCrewSessionService: RunCrewSessionService,
    private sharedSnackbarService: SharedSnackbarService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  manageAgentsAndTasks() {
    this.router.navigate(['/project', this.project.id]);
  }

  onDeleteProject() {
    this.deleteProject.emit(this.project.id);
  }

  startRun(): void {
    const dialogRef = this.dialog.open(this.confirmRunDialog, {
      width: '350px',
      height: '180px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        const sessionsSubscription: Subscription = this.runCrewSessionService
          .createSession(this.project.id)
          .subscribe({
            next: (response: RunCrewSessionRequest) => {
              const sessionId = response.session_id;
              console.log('Session ID:', sessionId);

              this.runSessionId = sessionId;
              this.cdr.detectChanges();

              this.sharedSnackbarService.showSnackbar(
                'Session started successfully!',
                'success'
              );
            },
            error: (error) => {
              console.error('Error creating session:', error);
              this.sharedSnackbarService.showSnackbar(
                'Failed to start session.',
                'error'
              );
            },
          });

        this.subscriptions.add(sessionsSubscription);
      }
    });
  }

  viewRunSession() {
    this.router.navigate([
      `/project/${this.project.id}/run-session/${this.runSessionId}`,
    ]);
  }

  stopRunSession() {
    if (this.runSessionId != null) {
      const stopSessionSubscription: Subscription = this.runCrewSessionService
        .stopSession(this.runSessionId)
        .subscribe({
          next: () => {
            this.sharedSnackbarService.showSnackbar(
              'Session stopped successfully!',
              'success'
            );
            this.runSessionId = null;
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error stopping session:', error);
            this.sharedSnackbarService.showSnackbar(
              'Failed to stop session.',
              'error'
            );
          },
        });
    }
  }
  copyProject() {}

  viewRunResults() {
    const sessionsSubscription: Subscription = this.runCrewSessionService
      .getSessionsByProjectId(this.project.id)
      .subscribe({
        next: (sessions: Session[]) => {
          console.log(sessions);

          this.dialog.open(SessionListDialogComponent, {
            height: '600px',
            width: '600px',
            data: { sessions: sessions, project: this.project },
            autoFocus: false,
          });
        },
        error: (error) => {
          console.error('Error fetching sessions:', error);
          this.sharedSnackbarService.showSnackbar(
            'Failed to fetch session results.',
            'error'
          );
        },
      });

    this.subscriptions.add(sessionsSubscription);
  }
}
