import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expandable-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="expandable-section">
      <div class="section-header" (click)="toggle()">
        <div class="header-content">
          <i class="ti ti-player-play-filled" [class.expanded]="expanded"></i>
          <span>{{ title }}</span>
        </div>
      </div>
      <div class="section-content" *ngIf="expanded">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .expandable-section {
        margin-bottom: 6px;
        border-radius: 6px;
        background-color: var(--gray-850);
        overflow: hidden;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background-color: var(--gray-800);
        color: var(--white);
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
        user-select: none;

        &:hover {
          background-color: var(--gray-750);
        }

        .header-content {
          display: flex;
          align-items: center;

          i {
            font-size: 11px;
            color: var(--gray-400);
            transition: transform 0.2s ease;
            margin-right: 8px;

            &.expanded {
              transform: rotate(90deg);
            }
          }
        }
      }

      .section-content {
        padding: 14px;
        color: var(--gray-300);
        font-size: 13px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandableSectionComponent {
  @Input() title: string = '';
  @Input() expanded: boolean = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  public toggle(): void {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}
