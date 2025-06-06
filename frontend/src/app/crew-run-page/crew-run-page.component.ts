import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../shared/models/project.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of, Subscription, switchMap } from 'rxjs';
import { Task } from '../shared/models/task.model';
import { Agent } from '../shared/models/agent.model';
import { AgentsService } from '../services/staff.service';
import { TasksService } from '../services/tasks.service';
import { SharedSnackbarService } from '../services/snackbar/shared-snackbar.service';
import { ProjectInfoComponent } from './run-page-components/project-info/project-info.component';
import { RunChatComponent } from './run-page-components/run-chat/run-chat.component';

@Component({
  selector: 'app-crew-run-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectInfoComponent, RunChatComponent],
  templateUrl: './crew-run-page.component.html',
  styleUrls: ['./crew-run-page.component.scss'],
})
export class CrewRunPageComponent implements OnInit, OnDestroy {
  project!: Project;
  agents: Agent[] = [];
  tasks: Task[] = [];
  sessionId!: number;

  isDataLoaded: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private agentsService: AgentsService,
    private tasksService: TasksService,
    private sharedSnackbarService: SharedSnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('run page loaded');

    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    const projectId: number = Number(
      this.route.snapshot.paramMap.get('projectId')
    );

    if (projectId) {
      this.getProjectById(projectId);
    } else {
      console.error('Project ID is invalid.');
      this.sharedSnackbarService.showSnackbar(
        'Project ID is invalid.',
        'error'
      );
    }
  }

  private getProjectById(projectId: number): void {
    const projectSubscription: Subscription = this.projectsService
      .getProjectById(projectId)
      .pipe(
        switchMap((project: Project) => {
          this.project = project;

          // Prepare agents observable
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

          // Fetch all tasks
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
          // Filter tasks by project ID
          this.tasks = tasks.filter((task) => task.crew === this.project.id);

          console.log('Agents:', this.agents);
          console.log('Tasks for project:', this.tasks);

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

    this.subscriptions.add(projectSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
