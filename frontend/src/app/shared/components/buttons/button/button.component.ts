import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '../../app-icon/app-icon.component';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() type: 'primary' | 'secondary' | 'ghost' | 'icon' = 'primary';
  @Input() leftIcon?: string; // e.g., 'ui/x'
  @Input() rightIcon?: string; // e.g., 'ui/chevron-down'
  @Input() disabled = false;
  @Input() ariaLabel?: string; // For accessibility
}
