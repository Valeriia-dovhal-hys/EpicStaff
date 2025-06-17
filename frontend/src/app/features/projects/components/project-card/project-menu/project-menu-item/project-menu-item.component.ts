import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { AppIconComponent } from '../../../../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-project-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, AppIconComponent],
  templateUrl: './project-menu-item.component.html',
  styleUrls: ['./project-menu-item.component.scss'],
})
export class ProjectMenuItemComponent {
  @Input() public icon!: string;
  @Input() public label!: string;
  @Input() public isDelete: boolean = false;
  @Output() public itemClick = new EventEmitter<MouseEvent>();

  // Convert Tabler icon class to app-icon format
  public get appIcon(): string {
    if (this.icon.startsWith('ti-')) {
      return `ui/${this.icon.substring(3)}`;
    }
    return this.icon;
  }

  public onClick(event: MouseEvent): void {
    this.itemClick.emit(event);
  }
}
