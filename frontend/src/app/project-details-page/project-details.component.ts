import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Project } from '../shared/models/project.model';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../services/projects.service';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AgentsDialogComponent } from './section-agents-info/agents-dialog/agents-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SharedSnackbarService } from '../services/snackbar/shared-snackbar.service';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { Agent, GetAgentRequest } from '../shared/models/agent.model';
import { AgentsService } from '../services/staff.service';
import { MatListModule } from '@angular/material/list';
import { TasksService } from '../services/tasks.service';
import { Task } from '../shared/models/task.model';

import { MatIconModule } from '@angular/material/icon';
import { CreateTaskFormDialogComponent } from '../forms/create-task-form-dialog/create-task-form-dialog.component';
import { switchMap } from 'rxjs/operators';

import { SectionProjectInfoComponent } from './section-project-info/section-project-info.component';
import { SectionAgentsInfoComponent } from './section-agents-info/section-agents-info.component';
import { SectionTasksInfoComponent } from './section-tasks-info/section-tasks-info.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    NgIf,

    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    MatListModule,

    MatIconModule,
    SectionProjectInfoComponent,
    SectionAgentsInfoComponent,
    SectionTasksInfoComponent,
  ],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent implements OnInit {
  project!: Project;
  agents: Agent[] = [];
  tasks: Task[] = [];

  isDataLoaded: boolean = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private sharedSnackbarService: SharedSnackbarService,
    private tasksService: TasksService,
    private agentsService: AgentsService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const projectId: number | null = Number(
      this.route.snapshot.paramMap.get('projectId')
    );
    if (projectId) {
      this.loadData(projectId);
    }
  }

  loadData(projectId: number): void {
    const projectSubscription = this.projectsService
      .getProjectById(projectId)
      .pipe(
        switchMap((project: Project) => {
          this.project = project;

          let agentsObservable: Observable<GetAgentRequest[]>;
          const agentIds: number[] = project.agents;

          if (agentIds && agentIds.length > 0) {
            const agentObservables: Observable<GetAgentRequest>[] =
              agentIds.map((id) => this.agentsService.getAgentById(id));
            agentsObservable = forkJoin(agentObservables);
          } else {
            agentsObservable = of([]);
          }

          // Prepare tasks observable
          const tasksObservable: Observable<Task[]> =
            this.tasksService.getTasks();

          return forkJoin({
            agents: agentsObservable,
            AllTasks: tasksObservable,
          });
        })
      )
      .subscribe({
        next: ({ agents, AllTasks }) => {
          this.agents = agents;

          this.tasks = AllTasks.filter((task) => task.crew === this.project.id);

          this.isDataLoaded = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching project, agents, or tasks:', error);
          this.sharedSnackbarService.showSnackbar(
            'Failed to load project details, agents, or tasks.',
            'error'
          );
        },
      });
    this.subscriptions.add(projectSubscription);
  }

  openAgentsDialog(): void {
    const dialogRef = this.dialog.open(AgentsDialogComponent, {
      data: { preSelectedAgents: this.agents, tasks: this.tasks },
      width: '600px',
      height: '600px',
    });

    const dialogSubscription = dialogRef.afterClosed().subscribe(
      (
        result: {
          selectedAgents: Agent[];
          tasksToUpdate?: Task[];
        } | null
      ) => {
        if (result) {
          const { selectedAgents, tasksToUpdate } = result;

          const selectedAgentIds = selectedAgents.map((agent) => agent.id);

          // Proceed to update project and tasks
          const projectUpdateObservable = this.projectsService.updateProject({
            ...this.project,
            agents: selectedAgentIds,
          });

          let tasksUpdateObservables: Observable<Task>[] = [];

          if (tasksToUpdate && tasksToUpdate.length > 0) {
            // Update tasks to set agent to null
            tasksUpdateObservables = tasksToUpdate.map((task) =>
              this.tasksService.updateTask({ ...task, agent: null })
            );
          }

          const forkJoinSubscription = forkJoin([
            projectUpdateObservable,
            ...tasksUpdateObservables,
          ]).subscribe({
            next: ([projectResponse, ...tasksResponses]) => {
              // Update local tasks array
              if (tasksToUpdate && tasksToUpdate.length > 0) {
                this.tasks = this.tasks.map((task) => {
                  const updatedTask = tasksResponses.find(
                    (t) => t.id === task.id
                  );
                  return updatedTask ? updatedTask : task;
                });
              }

              // Update agents
              this.agents = [...selectedAgents];
              this.cdr.markForCheck();

              this.sharedSnackbarService.showSnackbar(
                'Project and tasks updated successfully.',
                'success'
              );
            },
            error: (error) => {
              console.error('Error updating project and tasks:', error);
              this.sharedSnackbarService.showSnackbar(
                'Failed to update project and tasks.',
                'error'
              );
            },
          });

          this.subscriptions.add(forkJoinSubscription);
        }
      }
    );
    this.subscriptions.add(dialogSubscription);
  }

  openCreateTaskDialog(): void {
    const dialogRef = this.dialog.open(CreateTaskFormDialogComponent, {
      data: { agents: this.agents, projectId: this.project.id },
    });

    const dialogSubscription = dialogRef
      .afterClosed()
      .subscribe((newTaskData) => {
        if (newTaskData) {
          const createTaskSubscription = this.tasksService
            .createTask(newTaskData)
            .subscribe({
              next: (createdTask: Task) => {
                this.tasks = [...this.tasks, createdTask];
                this.cdr.markForCheck();
                this.sharedSnackbarService.showSnackbar(
                  'Task created successfully',
                  'success'
                );
              },
              error: (err) => {
                console.error('Error creating task:', err);
                this.sharedSnackbarService.showSnackbar(
                  'Error creating task',
                  'error'
                );
              },
            });
          this.subscriptions.add(createTaskSubscription);
        }
      });
    this.subscriptions.add(dialogSubscription);
  }

  onAgentRemoved(agent: Agent): void {
    // Remove the agent from the agents array
    this.agents = this.agents.filter((a) => a.id !== agent.id);

    // Remove the agent's ID from the project's agents array
    this.project.agents = this.project.agents.filter((id) => id !== agent.id);

    // Find tasks assigned to this agent
    const tasksToUpdate = this.tasks.filter((task) => task.agent === agent.id);

    // Update tasks to set agent to null
    const tasksUpdateObservables = tasksToUpdate.map((task) =>
      this.tasksService.updateTask({ ...task, agent: null })
    );

    // Update the project
    const projectUpdateObservable = this.projectsService.updateProject(
      this.project
    );

    // Combine all updates using an object
    const updateObservables = {
      updatedProject: projectUpdateObservable,
      updatedTasks:
        tasksUpdateObservables.length > 0
          ? forkJoin(tasksUpdateObservables)
          : of([] as Task[]),
    };

    const updateSubscription = forkJoin(updateObservables).subscribe({
      next: ({ updatedProject, updatedTasks }) => {
        // Update the local project
        this.project = updatedProject;

        // Update the local tasks array
        this.tasks = this.tasks.map((task) => {
          const updatedTask = updatedTasks.find((t) => t.id === task.id);
          return updatedTask ? updatedTask : task;
        });

        // Mark for change detection
        this.cdr.markForCheck();

        // Show success message
        this.sharedSnackbarService.showSnackbar(
          'Agent removed successfully.',
          'success'
        );
      },
      error: (error) => {
        console.error('Error updating project and tasks:', error);
        this.sharedSnackbarService.showSnackbar(
          'Failed to remove agent.',
          'error'
        );
      },
    });

    this.subscriptions.add(updateSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
