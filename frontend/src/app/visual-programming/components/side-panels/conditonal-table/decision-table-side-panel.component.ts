import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgFor, NgIf } from '@angular/common';
import {
  DecisionTableNodeModel,
  DecisionTableData,
  Condition,
} from '../../../core/models/node.model';
import { DragAndDropModule } from 'ag-grid-community';
import {
  generateDecisionTablePortsForNode,
  generatePortsForNode,
} from '../../../core/helpers/helpers';

@Component({
  selector: 'app-decision-table-side-panel',
  standalone: true,
  templateUrl: './decision-table-side-panel.component.html',
  styleUrls: ['./decision-table-side-panel.component.scss'],
  imports: [ReactiveFormsModule, NgFor, NgIf, DragDropModule],
})
export class DecisionTableSidePanelComponent implements OnInit {
  @Input() node!: DecisionTableNodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<DecisionTableNodeModel>();

  public decisionTableForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.decisionTableForm = this.fb.group({
      name: [this.node.data.name || 'New Decision Table', Validators.required],
      orderType: [this.node.data.orderType || 'and', Validators.required],
      conditions: this.fb.array(
        this.node.data.conditions
          .sort((a, b) => a.order - b.order)
          .map((cond) => this.createConditionGroup(cond))
      ),
    });
  }

  private createConditionGroup(condition: Condition): FormGroup {
    return this.fb.group({
      name: [condition.name, Validators.required],
      value: [condition.value, Validators.required],
      order: [condition.order, Validators.required],
    });
  }

  public get conditions(): FormArray {
    return this.decisionTableForm.get('conditions') as FormArray;
  }

  public addCondition(): void {
    const newOrder =
      this.conditions.length > 0
        ? this.conditions.at(this.conditions.length - 1).value.order + 1
        : 1;
    const newCondition: Condition = {
      name: `New Condition ${newOrder}`,
      value: '',
      order: newOrder,
    };
    this.conditions.push(this.createConditionGroup(newCondition));
  }

  public removeCondition(index: number): void {
    this.conditions.removeAt(index);
    this.updateConditionOrders();
  }

  public drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.conditions.controls,
      event.previousIndex,
      event.currentIndex
    );
    this.updateConditionOrders();
  }

  private updateConditionOrders(): void {
    // Reassign order values based on current order in the FormArray.
    this.conditions.controls.forEach((ctrl, index) => {
      ctrl.get('order')?.setValue(index + 1, { emitEvent: false });
    });
  }

  public getConditionLabel(index: number): string {
    const total = this.conditions.length;
    if (index === 0) {
      return 'IF';
    } else if (index === total - 1) {
      return 'DEFAULT';
    } else {
      return 'ELSE IF';
    }
  }
  public onSave(): void {
    if (this.decisionTableForm.valid) {
      const conditions = (
        this.decisionTableForm.get('conditions') as FormArray
      ).value.sort((a: Condition, b: Condition) => a.order - b.order);
      const updatedData: DecisionTableData = {
        name: this.decisionTableForm.value.name,
        orderType: this.decisionTableForm.value.orderType,
        conditions: conditions,
      };
      // Regenerate ports using the updated conditions
      const updatedPorts = generatePortsForNode(
        this.node.id,
        this.node.type,
        conditions
      );

      const updatedNode: DecisionTableNodeModel = {
        ...this.node,
        data: updatedData,
        ports: updatedPorts, // update ports accordingly
      };
      this.nodeUpdated.emit(updatedNode);
      this.closePanel.emit();
    }
  }

  public close(): void {
    this.closePanel.emit();
  }
}
