import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  Condition,
  DecisionTableData,
  DecisionTableNodeModel,
} from '../../../core/models/node.model';
import { NgFor, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-decision-table-node',
  standalone: true,
  template: `
    <div class="decision-table-node">
      <div class="conditions-list">
        <div
          *ngFor="let condition of sortedConditions; let i = index"
          class="condition-item"
        >
          <span class="condition-type">
            {{
              i === 0
                ? 'IF'
                : i < sortedConditions.length - 1
                ? 'ELIF'
                : 'DEFAULT'
            }}
          </span>
          <span class="condition-name">{{ condition.name }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .decision-table-node {
        /* No background or border for a clean look */
        background: transparent;
        border: none;
        font-size: 14px;
        /* Tweak color to match your theme. Example: dark text on lighter backgrounds */
        color: #333;
      }

      .conditions-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }

      .condition-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .condition-name {
        /* Left text styling */
        font-weight: 400;
        color: rgb(180, 180, 180); /* slightly lighter text, adjust as needed */
      }

      .condition-type {
        font-weight: 600;
        color: rgb(207, 207, 207); /* bold accent color, adjust as needed */
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor],
})
export class DecisionTableNodeComponent {
  @Input() node!: DecisionTableNodeModel;

  // Access the underlying decision table data
  get decisionData(): DecisionTableData {
    return this.node.data;
  }

  // Sort conditions by order
  get sortedConditions(): Condition[] {
    return [...this.decisionData.conditions].sort((a, b) => a.order - b.order);
  }
}
