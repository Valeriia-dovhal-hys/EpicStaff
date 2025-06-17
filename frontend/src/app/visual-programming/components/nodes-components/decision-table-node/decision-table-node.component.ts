import {
  Component,
  Input,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecisionTableNodeModel } from '../../../core/models/node.model';
import {
  ConditionGroup,
  Condition,
} from '../../../core/models/decision-table.model';
import { v4 as uuidv4 } from 'uuid';
import { FormsModule } from '@angular/forms';
import { FlowService } from '../../../services/flow.service';
import { EditableTextareaComponent } from './editable-textarea.component';
import { generatePortsForDecisionTableNode } from '../../../core/helpers/helpers';

@Component({
  selector: 'app-decision-table-node',
  templateUrl: './decision-table-node.component.html',
  styleUrls: ['./decision-table-node.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecisionTableNodeComponent {
  @Input({ required: true }) node!: DecisionTableNodeModel;
  @Output() addCondition = new EventEmitter<void>();

  get conditionGroups() {
    return this.node.data.table.condition_groups;
  }

  onAddCondition() {
    this.addCondition.emit();
  }

  trackByGroupName(index: number, group: any) {
    return group.group_name;
  }
}
