import { Component, Input } from '@angular/core';
import { PythonNodeModel } from '../../../core/models/node.model';

@Component({
  selector: 'app-python-node',
  standalone: true,
  template: `
    <div class="header">
      <div class="icon-wrapper">
        <i class="ti ti-brand-python"></i>
      </div>
      <div class="title">
        {{ node.data.name }}
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        padding: 1.3rem;
        gap: 1.3rem;
      }

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-wrapper i {
        color: var(--python-node-accent-color);
        font-size: 25px;
      }

      .title {
        font-size: 16px;
        font-weight: 500;
        letter-spacing: 0.5px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class PythonNodeComponent {
  @Input() node!: PythonNodeModel;
}
