import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { ProjectsStorageService } from '../../../../services/projects-storage.service';
import { ProjectTagsStorageService } from '../../../../services/project-tags-storage.service';
import { GetProjectRequest } from '../../../../models/project.model';
import { NgIf, NgFor } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectCardComponent } from '../../../../components/project-card/project-card.component';
import { Router } from '@angular/router';
import { AddProjectCardComponent } from './add-project-card/add-project-card.component';
import { LoadingSpinnerComponent } from '../../../../../../shared/components/loading-spinner/loading-spinner.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { ProjectTagsDialogComponent } from '../../../../components/project-tags-dialog/project-tags-dialog.component';
import { ProjectTagsApiService } from '../../../../services/project-tags-api.service';
import { CreateProjectComponent } from '../../../../components/create-project-form-dialog/create-project.component';

@Component({
  selector: 'app-my-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="project-grid">
      @if (!isProjectsLoaded()) {
      <app-loading-spinner
        size="md"
        message="Loading projects..."
      ></app-loading-spinner>
      } @else { @if (error()) {
      <div class="error">{{ error() }}</div>
      <button type="button" (click)="ngOnInit()">Retry</button>
      } @else {
      <div class="grid">
        <app-add-project-card
          (createClick)="onCreateProject()"
        ></app-add-project-card>

        @if (filteredProjects().length === 0) {
        <div class="empty-message">
          <p>No projects found. Create your first project to get started.</p>
        </div>
        } @else { @for (project of filteredProjects(); track project.id) {
        <app-project-card
          [project]="project"
          (cardClick)="onOpenProject(project.id)"
          (actionClick)="handleProjectAction($event)"
        >
        </app-project-card>
        } }
      </div>
      } }
    </div>
  `,
  styles: [
    `
      .project-grid {
        display: flex;
        flex-direction: column;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(335px, 1fr));
        gap: 1.5rem;
        width: 100%;
      }
      .empty-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem;
        color: var(--color-text-secondary);
        font-size: 1.1rem;
        background: var(--color-sidenav-background);
        border-radius: 8px;
        margin-top: 1rem;
      }
      .loading,
      .error {
        font-size: 1.1rem;
        color: #b0b8c1;
        margin-top: 2rem;
      }
      .error {
        color: #d32f2f;
      }
    `,
  ],
  imports: [
    ProjectCardComponent,
    AddProjectCardComponent,
    LoadingSpinnerComponent,
  ],
})
export class MyProjectsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly projectsStorageService = inject(ProjectsStorageService);
  private readonly projectTagsStorageService = inject(
    ProjectTagsStorageService
  );
  private readonly dialog = inject(Dialog);
  private readonly projectTagsApiService = inject(ProjectTagsApiService);

  public readonly error = signal<string | null>(null);
  public readonly filteredProjects =
    this.projectsStorageService.filteredProjects;
  public readonly isProjectsLoaded =
    this.projectsStorageService.isProjectsLoaded;

  constructor() {
    // Initial data fetch
    this.projectsStorageService.getProjects().subscribe();
    // Load tags for later use
    this.projectTagsStorageService.ensureLoaded().subscribe();
  }

  public ngOnInit(): void {
    if (!this.projectsStorageService.isProjectsLoaded()) {
      this.projectsStorageService.getProjects().subscribe({
        next: () => {},
        error: (err: HttpErrorResponse) => {
          console.error('Error loading projects', err);
          this.error.set('Failed to load projects. Please try again later.');
        },
      });
    }
  }

  public onOpenProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  public onCreateProject(): void {
    const dialogRef = this.dialog.open<GetProjectRequest | undefined>(
      CreateProjectComponent,
      {
        width: '590px',
        hasBackdrop: true,
      }
    );
    dialogRef.closed.subscribe((result: GetProjectRequest | undefined) => {
      if (result) {
        this.router.navigate(['/projects', result.id]);
      }
    });
  }

  public handleProjectAction(event: {
    action: string;
    project: GetProjectRequest;
  }): void {
    const { action, project } = event;

    switch (action) {
      case 'run':
        console.log('Running project:', project.id);
        break;
      case 'copy':
        console.log('Copying project:', project.id);
        break;
      case 'edit':
        this.router.navigate(['/projects', project.id, 'edit']);
        break;
      case 'manage-tags':
        this.openTagsDialog(project);
        break;
      case 'delete':
        console.log('Deleting project:', project.id);
        this.projectsStorageService.deleteProject(project.id).subscribe({
          next: () => console.log(`Project ${project.id} deleted`),
          error: (err) => console.error('Error deleting project', err),
        });
        break;
    }
  }

  private openTagsDialog(project: GetProjectRequest): void {
    const dialogRef = this.dialog.open<GetProjectRequest>(
      ProjectTagsDialogComponent,
      {
        data: { project },
        panelClass: 'tags-dialog-panel',
      }
    );

    dialogRef.closed.subscribe((updatedProject) => {
      if (updatedProject) {
        // Update the project in storage with new tags using the proper update method
        this.updateProjectInStorage(updatedProject);
      }
    });
  }

  private updateProjectInStorage(updatedProject: GetProjectRequest): void {
    // Use the proper method to update project in cache
    this.projectsStorageService.updateProjectInCache(updatedProject);
  }

  public editProject(project: GetProjectRequest): void {
    this.router.navigate(['/projects', project.id, 'settings']);
  }

  public openCreateProjectDialog(): void {
    // Logic to open a dialog or navigate to a creation page
    // Example: this.dialog.open(CreateProjectDialogComponent).closed.subscribe(result => ...);
    console.log('Open create project dialog - placeholder');
    this.router.navigate(['/projects', 'new']); // Placeholder navigation
  }
}
