import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
} from '@angular/core';
import { ProjectsStorageService } from '../../../../services/projects-storage.service';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ProjectCardComponent } from '../../../../components/project-card/project-card.component';
import { LoadingSpinnerComponent } from '../../../../../../shared/components/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { GetProjectRequest } from '../../../../models/project.model';

@Component({
  selector: 'app-project-templates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="templates-grid">
      @if (!isTemplatesLoaded()) {
      <app-loading-spinner
        size="md"
        message="Loading templates..."
      ></app-loading-spinner>
      } @else { @if (error()) {
      <div class="error">{{ error() }}</div>
      <button type="button" (click)="loadTemplates()">Retry</button>
      } @else {
      <div class="grid">
        @if (templates().length === 0) {
        <div class="empty-state">
          <p>No templates available. Please check back later.</p>
        </div>
        } @else { @for (template of templates(); track template.id) {
        <app-project-card
          [project]="template"
          (cardClick)="useTemplate(template.id)"
          (menuClick)="showTemplateOptions(template)"
        >
        </app-project-card>
        } }
      </div>
      } }
    </div>
  `,
  styles: [
    `
      .templates-grid {
        display: flex;
        flex-direction: column;
        /* flex: 1 1 auto; */ /* Removed to allow parent to scroll */
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 1.5rem;
        width: 100%;
      }
      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem;
        color: var(--color-text-secondary);
        font-size: 1.1rem;
        background: var(--color-sidenav-background);
        border-radius: 8px;
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
  imports: [ProjectCardComponent, LoadingSpinnerComponent, CommonModule],
})
export class ProjectTemplatesComponent {
  private projectsStorageService = inject(ProjectsStorageService);
  private readonly router = inject(Router);

  public readonly error = signal<string | null>(null);
  public readonly isTemplatesLoaded =
    this.projectsStorageService.isTemplatesLoaded;
  public readonly templates = this.projectsStorageService.filteredTemplates;

  constructor() {
    if (!this.projectsStorageService.isTemplatesLoaded()) {
      this.loadTemplates();
    }
  }

  public loadTemplates(forceRefresh = false): void {
    this.error.set(null);
    this.projectsStorageService.getTemplates(forceRefresh).subscribe({
      next: () => {},
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load templates', err);
        this.error.set(err.message || 'Failed to load templates');
      },
    });
  }

  useTemplate(templateId: number): void {
    this.router.navigate(['/projects/new'], {
      queryParams: { template: templateId },
    });
  }

  showTemplateOptions(template: any): void {
    console.log('Template options for:', template.name);
  }

  createProjectFromTemplate(template: GetProjectRequest): void {
    console.log('Creating project from template:', template);
    // Actual implementation would involve navigating or opening a dialog
    // and passing template data to pre-fill a new project form.
    // Example: this.router.navigate(['/projects', 'new'], { queryParams: { templateId: template.id } });
  }
}
