import {
  Component,
  Input,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  inject,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { GetProjectRequest } from '../../models/project.model';
import { NgClass, NgIf, NgFor, NgStyle } from '@angular/common';
import { TagComponent } from './tag.component';
import { ProjectMenuComponent } from './project-menu/project-menu.component';
import { ProjectTagsStorageService } from '../../services/project-tags-storage.service';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgStyle,
    TagComponent,
    ProjectMenuComponent,
    AppIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss'],
})
export class ProjectCardComponent implements OnInit, OnChanges {
  @Input() public project!: GetProjectRequest;
  @Output() public cardClick = new EventEmitter<void>();
  @Output() public actionClick = new EventEmitter<{
    action: string;
    project: GetProjectRequest;
  }>();
  private readonly projectTagsStorageService = inject(
    ProjectTagsStorageService
  );
  private readonly cdr = inject(ChangeDetectorRef);

  // Convert input to signal for reactivity
  private readonly projectSignal = signal<GetProjectRequest | null>(null);

  public isMenuOpen = false;
  public readonly maxVisibleTags = 2;

  // Color pairs for icon container and icon
  private readonly iconColors = [
    { bg: 'rgba(125, 211, 252, 0.15)', color: '#7dd3fc' }, // blue
    { bg: 'rgba(192, 132, 252, 0.15)', color: '#c084fc' }, // purple
    { bg: 'rgba(163, 230, 53, 0.15)', color: '#a3e635' }, // green
    { bg: 'rgba(253, 186, 116, 0.15)', color: '#fdba74' }, // orange
    { bg: 'rgba(110, 231, 183, 0.15)', color: '#6ee7b7' }, // teal
  ];
  private readonly colorIndex = Math.floor(
    Math.random() * this.iconColors.length
  );
  ngOnInit(): void {
    console.log('project', this.project);
    // Set initial project value
    if (this.project) {
      this.projectSignal.set(this.project);
    }
  }
  public getIconContainerStyle() {
    const pair = this.iconColors[this.colorIndex];
    return {
      'background-color': pair.bg,
    };
  }

  public getIconStyle() {
    const pair = this.iconColors[this.colorIndex];
    return {
      color: pair.color,
    };
  }

  // Get project icon from metadata or use default
  public getProjectIconPath(): string {
    // Try to get icon from metadata first
    if (this.project?.metadata?.icon) {
      return this.project.metadata.icon;
    }
    // Fallback to default icon
    return 'ui/star';
  }

  // Reactive computed properties for tags that will update when project or tags change
  public readonly projectTags = computed(() => {
    const project = this.projectSignal();
    if (project && project.tags && project.tags.length > 0) {
      const tagNames = this.projectTagsStorageService.getTagNames(project.tags);
      console.log(
        'project.tags computed for',
        project.id,
        ':',
        tagNames,
        'from IDs:',
        project.tags
      );
      return tagNames;
    }
    return [];
  });

  public readonly displayedTags = computed(() => {
    const tags = this.projectTags();
    if (!tags.length) return [];
    return tags.slice(0, this.maxVisibleTags);
  });

  public readonly hasMoreTags = computed(() => {
    return this.projectTags().length > this.maxVisibleTags;
  });

  public readonly additionalTagsCount = computed(() => {
    return Math.max(0, this.projectTags().length - this.maxVisibleTags);
  });

  constructor() {
    // Ensure tags are loaded
    this.projectTagsStorageService.ensureLoaded().subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update the signal when the project input changes
    if (changes['project'] && this.project) {
      console.log(
        'Project input changed:',
        this.project.id,
        'tags:',
        this.project.tags
      );
      this.projectSignal.set(this.project);
      // Trigger change detection to ensure UI updates
      this.cdr.markForCheck();
    }
  }

  public onMenuToggle(isOpen: boolean): void {
    this.isMenuOpen = isOpen;
  }

  public onActionSelected(action: string): void {
    this.actionClick.emit({ action, project: this.project });
  }
}
