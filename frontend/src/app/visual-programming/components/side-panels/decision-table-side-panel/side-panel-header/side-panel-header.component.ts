import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeModel } from '../../../../core/models/node.model';
import { NODE_ICONS, NODE_COLORS } from '../../../../core/enums/node-config';
import { getNodeTitle } from '../../../../core/enums/node-title.util';

@Component({
  selector: 'app-side-panel-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <div class="title">
        <i [class]="icon" [style.color]="color"></i>
        <span>{{ title }}</span>
      </div>
      <i class="ti ti-x close-icon" (click)="close.emit()"></i>
    </div>
  `,
  styleUrls: ['./side-panel-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidePanelHeaderComponent {
  @Input() node!: NodeModel;
  @Output() close = new EventEmitter<void>();

  get icon(): string {
    return NODE_ICONS[this.node?.type] || '';
  }
  get color(): string {
    return NODE_COLORS[this.node?.type] || '#fff';
  }
  get title(): string {
    return getNodeTitle(this.node);
  }
}
