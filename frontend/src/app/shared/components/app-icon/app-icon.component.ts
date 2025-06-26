import { Component, Input } from '@angular/core';
import { InlineSvgDirective } from '../../../core/directives/inline-svg.directive';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [InlineSvgDirective],
  template: `
    <span
      class="app-icon"
      [style.width]="size"
      [style.height]="size"
      appInlineSvg
      [path]="iconPath"
      [svgSize]="size"
      [attr.aria-label]="ariaLabel"
      aria-hidden="true"
    ></span>
  `,
  styles: [``],
})
export class AppIconComponent {
  @Input() icon: string = '';
  @Input() ariaLabel: string = '';
  @Input() size: string = '2rem';

  get iconPath(): string {
    return this.icon ? `/assets/icons/${this.icon}.svg` : '';
  }
}
