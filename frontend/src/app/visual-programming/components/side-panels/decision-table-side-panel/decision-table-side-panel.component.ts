import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { SidePanelService } from '../../../services/side-panel.service';
import { DecisionTableNodeModel } from '../../../core/models/node.model';
import { SidePanelHeaderComponent } from './side-panel-header/side-panel-header.component';
import { ConditionGroupsFormComponent } from './condition-groups-form/condition-groups-form.component';

@Component({
  selector: 'app-decision-table-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidePanelHeaderComponent,
    ConditionGroupsFormComponent,
  ],
  templateUrl: './decision-table-side-panel.component.html',
  styleUrls: ['./decision-table-side-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecisionTableSidePanelComponent implements OnInit {
  @Input() public node!: DecisionTableNodeModel;
  @Output() public closePanel = new EventEmitter<void>();
  @Output() public nodeUpdated = new EventEmitter<DecisionTableNodeModel>();
  @ViewChild(ConditionGroupsFormComponent)
  conditionGroupsForm!: ConditionGroupsFormComponent;

  public form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private readonly sidePanelService: SidePanelService
  ) {}

  ngOnInit() {
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: [this.node.data.name || ''],
    });
  }

  public onSave(): void {
    if (this.form.valid && this.conditionGroupsForm?.isValid()) {
      const conditionGroups =
        this.conditionGroupsForm?.getConditionGroups() || [];

      this.nodeUpdated.emit({
        ...this.node,
        data: {
          name: this.form.get('name')?.value || '',
          table: {
            ...this.node.data.table,
            condition_groups: conditionGroups,
          },
        },
      });
    }
  }

  public onClose(): void {
    this.sidePanelService.tryClosePanel().then((closed) => {
      if (closed) {
        this.closePanel.emit();
      }
    });
    this.closePanel.emit();
  }
}
