import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tooltip-container" [class.show]="visible">
      {{ text }}
      <span class="tooltip-arrow"></span>
    </div>
  `,
  styleUrls: ['./tooltip.component.scss'],
})
export class TooltipComponent {
  @Input() text = '';
  @Input() visible = false;
}
