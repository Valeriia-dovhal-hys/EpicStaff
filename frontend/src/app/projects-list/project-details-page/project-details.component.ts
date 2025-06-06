import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Project, Variable } from '../../shared/models/project.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService } from '../../services/projects.service';
import { NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AgentsDialogComponent } from '../../shared/components/agents-dialog/agents-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { forkJoin, Observable, of } from 'rxjs';
import { Agent } from '../../shared/models/agent.model';
import { AgentsService } from '../../services/staff.service';
import { MatListModule } from '@angular/material/list';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../shared/models/task.model';
import { ProjectTasksTableComponent } from '../../handsontable-tables/project-tasks-table/project-tasks-table.component';
import { MatIconModule } from '@angular/material/icon';
import { CreateTaskDialogComponent } from '../create-task-dialog/create-task-dialog.component';
import { switchMap } from 'rxjs/operators';
import {
  RunCrewSessionResponse,
  RunCrewSessionService,
} from '../../services/run-crew-session.service';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    MatListModule,
    ProjectTasksTableComponent,
    MatIconModule,
  ],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent implements OnInit {
  @ViewChild('confirmRunDialog') confirmRunDialog!: TemplateRef<any>;
  @ViewChild('confirmStopDialog') confirmStopDialog!: TemplateRef<any>;

  project!: Project;
  agents: Agent[] = [];
  tasks: Task[] = [];

  isDataLoaded: boolean = false;
  projectLoaded: boolean = false;

  sessionId: number | null = null; // Add this property

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private sharedSnackbarService: SharedSnackbarService,
    private tasksService: TasksService,
    private agentsService: AgentsService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private runCrewSessionService: RunCrewSessionService
  ) {}

  ngOnInit() {
    const projectId: number | null = Number(
      this.route.snapshot.paramMap.get('projectId')
    );
    if (projectId) {
      this.getProjectById(projectId);
    }
  }

  getProjectById(projectId: number): void {
    this.projectsService
      .getProjectById(projectId)
      .pipe(
        switchMap((project: Project) => {
          this.project = project;
          this.projectLoaded = true;

          let agentsObservable: Observable<Agent[]>;
          const agentIds: number[] = project.agents;

          if (agentIds && agentIds.length > 0) {
            const agentObservables: Observable<Agent>[] = agentIds.map((id) =>
              this.agentsService.getAgentById(id)
            );
            agentsObservable = forkJoin(agentObservables);
          } else {
            agentsObservable = of([]);
          }

          // Prepare tasks observable
          const tasksObservable: Observable<Task[]> =
            this.tasksService.getTasks();

          return forkJoin({
            agents: agentsObservable,
            tasks: tasksObservable,
          });
        })
      )
      .subscribe({
        next: ({ agents, tasks }) => {
          this.agents = agents;

          this.tasks = tasks.filter((task) => task.crew === this.project.id);

          this.isDataLoaded = true;
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: (error) => {
          console.error('Error fetching project, agents, or tasks:', error);
          this.sharedSnackbarService.showSnackbar(
            'Failed to load project details, agents, or tasks.',
            'error'
          );
        },
      });
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
        // Proceed to create session
        this.runCrewSessionService.createSession(this.project.id).subscribe({
          next: (response: RunCrewSessionResponse) => {
            this.sessionId = response.session_id; // Store the session ID
            console.log('Session ID:', this.sessionId);

            // this.project.sessionStatus = 'running';
            this.cdr.detectChanges();

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

  stopRun(): void {
    const dialogRef = this.dialog.open(this.confirmStopDialog, {
      width: '400px',
      height: '195px',
      disableClose: true, // Optional: Prevent closing by clicking outside
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // User clicked 'Yes'
        // this.project.sessionStatus = 'static';
        this.sessionId = null; // Clear the session ID
        this.cdr.detectChanges();

        // Show success snackbar message
        this.sharedSnackbarService.showSnackbar(
          'Project has been stopped!',
          'success'
        );
      } else {
        // User clicked 'No' or dismissed the dialog
        // Do nothing or handle accordingly
      }
    });
  }

  viewRunPage(): void {
    if (this.sessionId) {
      // Navigate to the 'project/:projectId/run-session/:sessionId' route
      this.router.navigate([
        `/project/${this.project.id}/run-session/${this.sessionId}`,
      ]);
    } else {
      // Handle case when session ID is not available
      this.sharedSnackbarService.showSnackbar(
        'Session has not been started yet.',
        'error'
      );
    }
  }

  openCreateTaskDialog(): void {
    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      width: '600px', // Adjust the width as needed
      data: { agents: this.agents, projectId: this.project.id },
    });

    dialogRef.afterClosed().subscribe((newTaskData) => {
      if (newTaskData) {
        // Now create the task using tasksService
        this.tasksService.createTask(newTaskData).subscribe({
          next: (createdTask: Task) => {
            // Update the tasks array with a new reference
            this.tasks = [...this.tasks, createdTask];
            this.cdr.detectChanges();
            this.sharedSnackbarService.showSnackbar(
              'Task created successfully',
              'success'
            );
            // No need to call detectChanges() since the array reference changed
          },
          error: (err) => {
            console.error('Error creating task:', err);
            this.sharedSnackbarService.showSnackbar(
              'Error creating task',
              'error'
            );
          },
        });
      }
    });
  }
}
