import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectListItem } from '../../models/project-list-item.model';

@Component({
  selector: 'app-project-card-menu',
  template: `
    <div class="menu-content" (click)="$event.stopPropagation()">
      <!-- <div class="menu-item">
        <i class="ti ti-player-play"></i>
        <span>Run</span>
      </div> -->
      <div class="menu-item" (click)="toggleFavorite($event)">
        <i
          class="ti"
          [ngClass]="project.favorite ? 'ti-star-filled active' : 'ti-star'"
        ></i>
        <span>{{
          project.favorite ? 'Remove from favorites' : 'Add to favorites'
        }}</span>
      </div>

      <div class="menu-item" (click)="onCopyProject()">
        <i class="ti ti-copy"></i>
        <span>Copy</span>
      </div>
      <div class="menu-item" (click)="onDeleteProject()">
        <i class="ti ti-trash"></i>
        <span>Delete</span>
      </div>
    </div>
  `,
  styleUrls: ['./project-card-sub-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class ProjectCardMenuComponent {
  @Input() project!: ProjectListItem;

  @Output() deleteProject = new EventEmitter<void>();

  @Output() copyProject = new EventEmitter<void>();
  @Output() toggleFavoriteStatus = new EventEmitter<void>();

  onDeleteProject(): void {
    this.deleteProject.emit();
  }

  onCopyProject(): void {
    this.copyProject.emit();
  }

  toggleFavorite(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleFavoriteStatus.emit();
  }
}
