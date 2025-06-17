import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  Inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA, DialogModule } from '@angular/cdk/dialog';

import { ProjectTagsApiService } from '../../services/project-tags-api.service';
import { ProjectTagsStorageService } from '../../services/project-tags-storage.service';
import { ProjectsApiService } from '../../services/projects-api.service';
import {
  GetCrewTagRequest,
  CreateCrewTagRequest,
} from '../../models/crew-tag.model';
import { GetProjectRequest } from '../../models/project.model';

import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';
import { SearchComponent } from '../../../../shared/components/search/search.component';
import { ToastService } from '../../../../services/notifications/toast.service';

interface DialogData {
  project: GetProjectRequest;
}

@Component({
  selector: 'app-project-tags-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, AppIconComponent, SearchComponent],
  templateUrl: './project-tags-dialog.component.html',
  styleUrls: ['./project-tags-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTagsDialogComponent implements OnInit {
  private readonly projectTagsApiService = inject(ProjectTagsApiService);
  private readonly projectTagsStorageService = inject(
    ProjectTagsStorageService
  );
  private readonly projectsApiService = inject(ProjectsApiService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(DialogRef);

  public readonly selectedTagIds = signal<Set<number>>(new Set());
  public readonly searchTerm = signal<string>('');

  public readonly allTags = computed(() =>
    this.projectTagsStorageService.allTags()
  );

  public readonly filteredTags = computed(() => {
    const tags = this.allTags();
    const search = this.searchTerm().toLowerCase();
    if (!search) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(search));
  });

  public readonly canCreateNewTag = computed(() => {
    const search = this.searchTerm().trim();
    if (!search) return false;

    const existingTags = this.allTags();
    const searchLower = search.toLowerCase();

    return !existingTags.some((tag) => tag.name.toLowerCase() === searchLower);
  });

  constructor(@Inject(DIALOG_DATA) public data: DialogData) {
    // Initialize selected tags from project (tags are stored as IDs only)
    if (data.project.tags && data.project.tags.length > 0) {
      const tagIds = new Set(data.project.tags);
      console.log('Pre-selecting tags:', data.project.tags, 'as Set:', tagIds);
      this.selectedTagIds.set(tagIds);
    } else {
      console.log('No tags to pre-select for project:', data.project.name);
    }
  }

  ngOnInit(): void {
    this.loadTags();
  }

  private loadTags(): void {
    this.projectTagsStorageService.getTags().subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.toastService.error('Failed to load tags');
        this.cdr.markForCheck();
      },
    });
  }

  public onSearchChange(searchTerm: string): void {
    this.searchTerm.set(searchTerm);
  }

  public toggleTag(tag: GetCrewTagRequest): void {
    const selectedIds = new Set(this.selectedTagIds());
    if (selectedIds.has(tag.id)) {
      selectedIds.delete(tag.id);
    } else {
      selectedIds.add(tag.id);
    }
    this.selectedTagIds.set(selectedIds);
  }

  public isTagSelected(tag: GetCrewTagRequest): boolean {
    return this.selectedTagIds().has(tag.id);
  }

  public createTagFromSearch(): void {
    const tagName = this.searchTerm().trim();
    if (!tagName) return;

    const newTag: CreateCrewTagRequest = {
      name: tagName,
      predifined: false,
    };

    this.projectTagsApiService.createCrewTag(newTag).subscribe({
      next: (createdTag) => {
        this.projectTagsStorageService.addTagToCache(createdTag);
        this.selectedTagIds.update((ids) => new Set([...ids, createdTag.id]));
        this.searchTerm.set(''); // Clear search after creating
        this.toastService.success(`Tag "${tagName}" created`);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error creating tag:', error);
        this.toastService.error('Failed to create tag');
        this.cdr.markForCheck();
      },
    });
  }

  public save(): void {
    const tagIds = Array.from(this.selectedTagIds());
    console.log(
      'Saving project tags:',
      tagIds,
      'for project:',
      this.data.project.id
    );

    this.projectsApiService
      .patchUpdateProject(this.data.project.id, { tags: tagIds })
      .subscribe({
        next: (updatedProject) => {
          console.log('Project tags saved successfully:', updatedProject);
          this.toastService.success('Tags updated');
          this.dialogRef.close(updatedProject);
        },
        error: (error) => {
          console.error('Error updating project tags:', error);
          this.toastService.error('Failed to update tags');
          this.cdr.markForCheck();
        },
      });
  }

  public cancel(): void {
    this.dialogRef.close();
  }
}
