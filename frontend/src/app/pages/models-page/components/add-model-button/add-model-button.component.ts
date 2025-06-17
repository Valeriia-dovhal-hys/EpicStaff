import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-model-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="add-model-btn"
      [class]="buttonClass"
      (click)="onClick()"
    >
      <i class="ti ti-plus"></i>
      {{ buttonText }}
    </button>
  `,
  styles: [
    `
      .add-model-btn {
        display: flex;
        align-items: center;
        background-color: var(--accent-color);
        color: var(--white);
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        i {
          font-size: 14px;
          width: 14px;
          height: 14px;
          margin-right: 6px;
        }

        &:hover {
          background-color: var(--accent-hover-color, #5040ff);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddModelButtonComponent {
  @Input() buttonText = 'Add Model';
  @Input() buttonClass = '';
  @Output() add = new EventEmitter<void>();

  onClick(): void {
    this.add.emit();
  }
}
