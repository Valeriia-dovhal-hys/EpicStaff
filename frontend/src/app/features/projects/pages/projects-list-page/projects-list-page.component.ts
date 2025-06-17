import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
// import { SearchComponent } from '../../../../shared/components/search/search.component'; // Likely unused now
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { TabButtonComponent } from '../../../../shared/components/tab-button/tab-button.component';
// import { ButtonVariant } from '../../../../core/enums/button-variants.enum'; // Likely unused now
// import { NgClass } from '@angular/common'; // Likely unused now
import { Dialog } from '@angular/cdk/dialog';
import { CreateProjectComponent } from '../../../../shared/components/create-project-form-dialog/create-project.component';
import { ProjectsStorageService } from '../../services/projects-storage.service';
import { GetProjectRequest } from '../../models/project.model';
import {
  FiltersListComponent,
  SearchFilterChange,
} from '../../../../shared/components/filters-list/filters-list.component'; // New Import
import {
  ProjectTagsFilterComponent,
  ProjectTagsFilterChange,
} from '../../components/project-tags-filter/project-tags-filter.component';

@Component({
  selector: 'app-projects-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-list-page.component.html',
  styleUrls: ['./projects-list-page.component.scss'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonComponent,
    TabButtonComponent,
    FiltersListComponent,
    ProjectTagsFilterComponent,
  ],
})
export class ProjectsListPageComponent {
  public tabs = [
    { label: 'My projects', link: 'my' },
    { label: 'Templates', link: 'templates' },
  ];

  private currentFilter: SearchFilterChange = { searchTerm: '' };

  constructor(
    public router: Router,
    private dialog: Dialog,
    private projectsService: ProjectsStorageService
  ) {}

  get isMyProjectsActive(): boolean {
    return this.router.url.includes('/projects/my');
  }
  get isTemplatesActive(): boolean {
    return this.router.url.includes('/projects/templates');
  }

  public onFiltersChange(event: SearchFilterChange): void {
    this.currentFilter = {
      ...this.currentFilter,
      searchTerm: event.searchTerm,
    };
    this.projectsService.setFilter(this.currentFilter);
  }

  public onProjectTagsChange(event: ProjectTagsFilterChange): void {
    this.currentFilter = {
      ...this.currentFilter,
      selectedTagIds: event.selectedTagIds,
    };
    this.projectsService.setFilter(this.currentFilter);
  }

  public openCreateProjectDialog(): void {
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
}
