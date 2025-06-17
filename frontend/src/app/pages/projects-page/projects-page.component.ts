import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
} from '@angular/core';

import { NewProjectCardComponent } from './new-project/new-project-card.component';
import { DialogModule, Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { CreateProjectComponent } from '../../forms/create-project-form-dialog/create-project.component';
import { PageHeaderComponent } from '../../shared/components/header/page-header.component';
import { ToastService } from '../../services/notifications/toast.service';
import { ProjectsService } from './services/projects.service';
import { ConfirmationDialogService } from '../../shared/components/cofirm-dialog/confimation-dialog.service';
import { GetProjectRequest, ProjectDto } from './models/project.model';
import { ProjectListItemCardComponent } from './project-list-item-card/project-list-item-card.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { ProjectListItem } from './models/project-list-item.model';

@Component({
  selector: 'app-projects-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DialogModule,
    ProjectListItemCardComponent,
    PageHeaderComponent,
    NewProjectCardComponent,
    SpinnerComponent,
  ],
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.scss'],
  standalone: true,
})
export class ProjectsPageComponent implements OnInit, OnDestroy {
  public projects: ProjectListItem[] = [];
  public filteredProjects: ProjectListItem[] = [];
  public searchTerm: string = '';
  public showFavorites: boolean = false;
  public isLoading = signal<boolean>(true);

  private subscriptions = new Subscription();

  private labels = [
    'Economy',
    'Technology',
    'Automation',
    'Healthcare',
    'Finance',
    'Education',
    'Marketing',
    'Energy',
    'Logistics',
    'AI and ML',
    'Research',
    'E-Commerce',
    'Sustainability',
    'Innovation',
    'Cybersecurity',
  ];

  constructor(
    private projectsService: ProjectsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cdkDialog: Dialog,
    private toastService: ToastService,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    const loadStartTime = Date.now();

    const projectsSubscription = this.projectsService
      .getProjects()
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
        next: (projects) => {
          // Sort projects by id in descending order (higher id first)
          const sortedProjects: GetProjectRequest[] = projects.sort(
            (a, b) => b.id - a.id
          );

          // Map projects to include random labels and a default favorite status
          this.projects = sortedProjects.map((project) => ({
            ...project,
            labels: this.getRandomLabels(),
            favorite: false,
          })) as ProjectListItem[];

          // Initialize filtered projects
          this.filteredProjects = [...this.projects];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching projects:', error);
          this.cdr.markForCheck();
        },
      });

    this.subscriptions.add(projectsSubscription);
  }

  // Get 2-4 random labels for a project
  private getRandomLabels(): string[] {
    const shuffledLabels = [...this.labels].sort(() => Math.random() - 0.5);
    const minLabels = 2;
    const maxAdditionalLabels = Math.floor(Math.random() * 2); // 0 or 1 additional label
    const numLabels = minLabels + maxAdditionalLabels;
    return shuffledLabels.slice(0, numLabels);
  }

  // Filter projects by search term and favorite status
  private applyFilters(): void {
    this.filteredProjects = this.projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (project.description &&
          project.description
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()));
      const matchesFavorite = !this.showFavorites || project.favorite;
      return matchesSearch && matchesFavorite;
    });

    this.cdr.markForCheck();
  }

  // Header event handlers
  public onSearchInput(term: string): void {
    this.searchTerm = term.toLowerCase().trim();
    this.applyFilters();
  }

  public toggleFavoriteFilter(): void {
    this.showFavorites = !this.showFavorites;
    this.applyFilters();
  }

  public openCreateFormDialog(): void {
    // Using CDK Dialog instead of MatDialog
    const dialogRef = this.cdkDialog.open<ProjectDto | undefined>(
      CreateProjectComponent,
      {
        width: '590px',
        hasBackdrop: true,
      }
    );
    dialogRef.closed.subscribe((result: ProjectDto | undefined) => {
      if (result) {
        const newProject: ProjectListItem = {
          ...result,
          favorite: false,
          labels: ['New', ...this.getRandomLabels().slice(0, 1)],
        };

        this.projects.unshift(newProject);
        this.applyFilters();

        this.cdr.markForCheck();

        this.router.navigate(['/project', result.id]);
      }
    });
  }

  public navigateToProjectDetails(projectId: number): void {
    this.router.navigate(['/project', projectId]);
  }

  public onDeleteProject(project: ProjectListItem): void {
    this.confirmationService
      .confirmDelete(project.name)
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          const deleteSubscription = this.projectsService
            .deleteProject(project.id)
            .subscribe({
              next: () => {
                this.projects = this.projects.filter(
                  (p) => p.id !== project.id
                );
                this.applyFilters();

                this.toastService.success(
                  `Project "${project.name}" has been deleted`
                );

                this.cdr.markForCheck();
              },
              error: (error) => {
                console.error('Error deleting project:', error);

                this.toastService.error(
                  `Failed to delete project: ${
                    error.message || 'Unknown error'
                  }`
                );
                this.cdr.markForCheck();
              },
            });

          this.subscriptions.add(deleteSubscription);
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
