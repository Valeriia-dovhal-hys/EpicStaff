import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AppIconComponent } from '../../app-icon/app-icon.component';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <button
      type="button"
      class="icon-button"
      [style.width]="size"
      [style.height]="size"
      (click)="onClick()"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
    >
      <app-icon
        [icon]="icon"
        [size]="iconSize"
        [ariaLabel]="ariaLabel"
      ></app-icon>
    </button>
  `,
  styles: [
    `
      .icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        padding: 0;

        &:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1);
        }

        &:active:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.15);
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        app-icon {
          margin-left: 1px;
        }
      }
    `,
  ],
})
export class IconButtonComponent {
  @Input() icon: string = '';
  @Input() size: string = '2rem';
  @Input() ariaLabel: string = '';
  @Input() disabled: boolean = false;
  @Output() click = new EventEmitter<void>();

  get iconSize(): string {
    // Calculate icon size as 60% of button size
    const sizeValue = parseFloat(this.size);
    const unit = this.size.replace(/[\d.]/g, '');
    return `${sizeValue * 0.6}${unit}`;
  }

  onClick(): void {
    if (!this.disabled) {
      this.click.emit();
    }
  }
}
