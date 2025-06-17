import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';
import { ProjectTagsStorageService } from '../../services/project-tags-storage.service';
import { GetCrewTagRequest } from '../../models/crew-tag.model';

export interface ProjectTagsFilterChange {
  selectedTagIds: number[];
}

@Component({
  selector: 'app-project-tags-filter',
  standalone: true,
  imports: [CommonModule, ButtonComponent, AppIconComponent],
  templateUrl: './project-tags-filter.component.html',
  styleUrls: ['./project-tags-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTagsFilterComponent implements OnInit {
  private readonly projectTagsService = inject(ProjectTagsStorageService);

  @Output() change = new EventEmitter<ProjectTagsFilterChange>();

  // Component state
  isDropdownOpen = signal(false);
  selectedTagIds = signal<number[]>([]);
  tempSelectedTagIds = signal<number[]>([]);

  // Computed values
  allTags = this.projectTagsService.allTags;
  isTagsLoaded = this.projectTagsService.isTagsLoaded;

  selectedTagsCount = computed(() => this.selectedTagIds().length);
  buttonText = computed(() => {
    const count = this.selectedTagsCount();
    return count > 0 ? `Tags (${count})` : 'Tags';
  });

  ngOnInit(): void {
    this.projectTagsService.getTags().subscribe();
  }

  toggleDropdown(): void {
    if (this.isDropdownOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    this.tempSelectedTagIds.set([...this.selectedTagIds()]);
    this.isDropdownOpen.set(true);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  isTagSelected(tagId: number): boolean {
    return this.tempSelectedTagIds().includes(tagId);
  }

  toggleTag(tagId: number): void {
    const current = this.tempSelectedTagIds();
    if (current.includes(tagId)) {
      this.tempSelectedTagIds.set(current.filter((id) => id !== tagId));
    } else {
      this.tempSelectedTagIds.set([...current, tagId]);
    }
  }

  onApply(): void {
    this.selectedTagIds.set([...this.tempSelectedTagIds()]);
    this.change.emit({ selectedTagIds: this.selectedTagIds() });
    this.closeDropdown();
  }

  onCancel(): void {
    this.tempSelectedTagIds.set([...this.selectedTagIds()]);
    this.closeDropdown();
  }

  onClearAll(): void {
    this.tempSelectedTagIds.set([]);
  }

  trackByTagId(index: number, tag: GetCrewTagRequest): number {
    return tag.id;
  }
}
