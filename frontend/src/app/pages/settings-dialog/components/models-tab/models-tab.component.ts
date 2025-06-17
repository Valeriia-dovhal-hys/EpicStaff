import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ModelsPageComponent } from '../models-page/models-page.component';

@Component({
  selector: 'app-models-tab',
  standalone: true,
  imports: [ModelsPageComponent],
  template: `
    <div class="tab-container">
      <app-models-page2></app-models-page2>
    </div>
  `,
  styles: [
    `
      .tab-container {
        padding: 16px 24px 24px 24px;
        overflow-y: auto;
        max-height: 550px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsTabComponent {}
