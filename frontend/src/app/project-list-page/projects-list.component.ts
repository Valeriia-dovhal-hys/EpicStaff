import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../shared/models/project.model';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ProjectListItemCardComponent } from './project-list-item-card/project-list-item-card.component';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectFormDialogComponent } from '../forms/create-project-form-dialog/create-project-form-dialog.component';
import { SharedSnackbarService } from '../services/snackbar/shared-snackbar.service';
import { ApiGetRequest } from '../shared/models/api-request.model';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    ProjectListItemCardComponent,
  ],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
})
export class ProjectsListComponent implements OnInit {
  projects: Project[] = [];
  isLoading: boolean = false;

  private subscriptions = new Subscription();

  constructor(
    private projectsService: ProjectsService,
    private router: Router,
    private dialog: MatDialog,
    private snackbarService: SharedSnackbarService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    const projectsSubscription: Subscription = this.projectsService
      .getProjects()
      .subscribe({
        next: (projects: Project[]) => {
          this.projects = projects;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching projects:', error);
          this.isLoading = false;
        },
      });
    this.subscriptions.add(projectsSubscription);
  }

  public openCreateProjectFormDialog(): void {
    const dialogRef = this.dialog.open(CreateProjectFormDialogComponent, {
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result: Project | undefined) => {
      if (result) {
        console.log(result);

        this.projectsService.createProject(result).subscribe({
          next: (response: Project) => {
            console.log('response', response);

            this.snackbarService.showSnackbar(
              `Project "${response.name}" created successfully.`,
              'success'
            );

            // Navigate to the new project's page
            this.router.navigate(['/project', response.id]);
          },
          error: (error) => {
            console.error('Error creating project:', error);
            this.snackbarService.showSnackbar(
              'Failed to create project. Please try again.',
              'error'
            );
          },
        });
      }
    });
  }

  public onDeleteProject(projectId: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectsService.deleteProject(projectId).subscribe({
        next: () => {
          this.projects = this.projects.filter(
            (project) => project.id !== projectId
          );
          this.snackbarService.showSnackbar(
            'Project deleted successfully.',
            'success'
          );
        },
        error: (error) => {
          console.error(`Error deleting project ${projectId}:`, error);
          this.snackbarService.showSnackbar(
            'Failed to delete project. Please try again.',
            'error'
          );
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  test() {}
}
