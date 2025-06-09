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
import { RunCrewSessionService } from '../../services/run-crew-session.service';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RunCrewSessionRequest } from '../../shared/models/RunCrewSession.model';

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
    MatDialogModule, // Add MatDialogModule to imports
  ],
})
export class ProjectListItemCardComponent {
  @Input() project!: Project;
  @Output() deleteProject = new EventEmitter<number>();

  // Get a reference to the dialog template
  @ViewChild('confirmRunDialog') confirmRunDialog!: TemplateRef<any>;

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
      width: '400px',
      height: '180px',
      disableClose: true, // Optional: Prevent closing by clicking outside
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // User clicked 'Yes'
        // Proceed to create session and navigate to run page
        this.runCrewSessionService.createSession(this.project.id).subscribe({
          next: (response: RunCrewSessionRequest) => {
            const sessionId = response.session_id;
            console.log('Session ID:', sessionId);

            // Update sessionStatus if needed
            // this.project.sessionStatus = 'running';
            this.cdr.detectChanges();

            // Navigate to the run page
            this.router.navigate([
              `/project/${this.project.id}/run-session/${sessionId}`,
            ]);

            // Show success snackbar message
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
      } else {
        // User clicked 'No' or dismissed the dialog
        // Do nothing or handle accordingly
      }
    });
  }

  // Existing method to run the project
  runProject(): void {
    this.runCrewSessionService.createSession(this.project.id).subscribe({
      next: (response: RunCrewSessionRequest) => {
        const sessionId = response.session_id;
        console.log('Session ID:', sessionId);

        // Navigate to the run page
        this.router.navigate([
          `/project/${this.project.id}/run-session/${sessionId}`,
        ]);

        // Display success message
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
  }
}
