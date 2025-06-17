import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './header/header.component';
import { DetailsContentComponent } from './details-content/details-content.component';
import { VariablesContentComponent } from './variables-content/variables-content.component';
import { AgentsSectionComponent } from './agents-section/agents-section.component';
import { TasksSectionComponent } from './tasks-section/tasks-section.component';
import { SettingsSectionComponent } from './settings-section/settings-section.component';
import { FormsModule } from '@angular/forms';
import { SessionsSectionComponent } from './sessions-section/sessions-section.component';
import { ProjectsService } from '../pages/projects-page/services/projects.service';
import { TasksService } from '../services/tasks.service';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { GetProjectRequest } from '../pages/projects-page/models/project.model';
import { RunCrewSessionService } from '../services/run-crew-session.service';
import { FullTask } from './models/full-task.model';
import { FullAgentService } from '../services/full-agent.service';
import { ProjectStateService } from './services/project-state.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { ToastService } from '../services/notifications/toast.service';
import { SpinnerComponent } from '../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-open-project-page',
  standalone: true,
  templateUrl: './open-project-page.component.html',
  styleUrls: ['./open-project-page.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    HeaderComponent,
    DetailsContentComponent,
    VariablesContentComponent,
    AgentsSectionComponent,
    TasksSectionComponent,
    SettingsSectionComponent,
    FormsModule,
    SpinnerComponent,
  ],
  animations: [
    trigger('slideAnimation', [
      state(
        'collapsed',
        style({
          height: '0',
          opacity: 0,
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          opacity: 1,
        })
      ),
      // Use a cubic-bezier easing curve for a smoother effect.
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)'),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenProjectPageComponent implements OnInit, OnDestroy {
  public readonly projectId = input.required<string>();
  public project!: GetProjectRequest;
  private subscription = new Subscription();
  public isLoading = signal(true);

  // Track expanded sections with a Set
  public expandedSections = new Set<string>();

  constructor(
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private cdr: ChangeDetectorRef,
    private runCrewSessionService: RunCrewSessionService,
    private fullAgentService: FullAgentService,
    public projectStateService: ProjectStateService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData(): void {
    const loadStartTime = Date.now();
    this.isLoading.set(true);

    const projectRequest = this.projectsService.getProjectById(
      +this.projectId()
    );
    const tasksRequest = this.tasksService.getTasksByProjectId(
      this.projectId()
    );
    const agentsRequest = this.fullAgentService.getFullAgentsByProject(
      +this.projectId()
    );

    const combinedRequest = forkJoin({
      project: projectRequest,
      tasks: tasksRequest,
      agents: agentsRequest,
    });

    this.subscription.add(
      combinedRequest
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
          next: ({ project, tasks, agents }) => {
            this.projectStateService.setProject(project);

            this.project = project;

            // Map tasks to FullTaskModel by finding the complete agent data
            const fullTaskModels: FullTask[] = tasks.map((task) => ({
              ...task,
              agentData: task.agent
                ? agents.find((agent) => agent.id === task.agent) || null
                : null,
            }));
            // Set the tasks and agents state
            this.projectStateService.updateTasks(fullTaskModels);
            this.projectStateService.updateAgents(agents);

            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to fetch project data', err);
            this.toastService.error('Failed to load project data');
          },
        })
    );
  }

  // Check if a section is expanded
  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections.has(sectionId);
  }

  // Toggle section expansion (now allows multiple open sections)
  toggleSection(sectionId: string): void {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }

    this.cdr.markForCheck();
  }

  onAddAgent(event: MouseEvent) {
    // Prevent the section from toggling
    event.stopPropagation();
    // Add your agent creation logic here
    console.log('Add agent clicked');
  }

  onAddTask(event: MouseEvent) {
    // Prevent the section from toggling
    event.stopPropagation();
    // Add your task creation logic here
    console.log('Add task clicked');
  }

  onSettingsChanged(updatedSettings: Partial<GetProjectRequest>) {
    const keys = Object.keys(
      updatedSettings
    ) as (keyof Partial<GetProjectRequest>)[];

    // Log the updated settings object
    console.log('Updated settings received:', updatedSettings);

    keys.forEach((key) => {
      const updatedValue = updatedSettings[key];

      // Log each setting change
      console.log(
        `Setting change detected: Key: ${key}, Value: ${updatedValue}`
      );

      if (updatedValue !== undefined) {
        this.updateProjectSetting(key, updatedValue);
      }
    });
  }

  private updateProjectSetting(key: string, value: any) {
    // Create a copy of the current project and update the specific field
    const updatedProject = { ...this.project, [key]: value };

    // Log the updated project and the patch data
    console.log(`Sending update for ${key} with new value:`, updatedProject);

    // Send the updated project with PUT request
    this.projectsService.updateProject(updatedProject).subscribe({
      next: (response) => {
        this.toastService.success('Project updated successfully');
        console.log('Project updated successfully:', response);
      },
      error: (error) => {
        // Log the error if the update fails
        console.error(`Error updating project field ${key}:`, error);
      },
    });
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.projectStateService.setProject(null);
    this.subscription.unsubscribe();
  }
}
