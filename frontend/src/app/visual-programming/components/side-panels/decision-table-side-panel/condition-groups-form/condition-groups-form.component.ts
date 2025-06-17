import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { ConditionGroup } from '../../../../core/models/decision-table.model';

@Component({
  selector: 'app-condition-groups-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="condition-groups" [formGroup]="form">
      <div formArrayName="conditionGroups">
        <div
          *ngFor="let group of conditionGroups.controls; let i = index"
          [formGroupName]="i"
          class="condition-group"
        >
          <div class="form-field group-name">
            <div class="group-name-header">
              <label>Condition Name <span class="required">*</span></label>
              <button type="button" class="remove-btn" (click)="removeGroup(i)">
                Remove
              </button>
            </div>
            <input
              formControlName="group_name"
              placeholder="Enter group name"
              [class.error]="
                group.get('group_name')?.invalid &&
                group.get('group_name')?.touched
              "
            />
            <div
              class="error-message"
              *ngIf="
                group.get('group_name')?.invalid &&
                group.get('group_name')?.touched
              "
            >
              CON name is required
            </div>
          </div>

          <div class="form-field">
            <label>Expression</label>
            <input
              formControlName="expression"
              placeholder="Enter condition expression"
            />
          </div>

          <div class="form-field manipulation">
            <label>On Expression Success Do</label>
            <input
              formControlName="manipulation"
              placeholder="Enter manipulation"
            />
          </div>

          <div class="form-field">
            <label>Next Node</label>
            <input formControlName="next_node" placeholder="Enter next node" />
          </div>
        </div>
      </div>

      <button type="button" class="add-btn" (click)="addGroup()">
        Add Condition Group
      </button>
    </div>
  `,
  styles: [
    `
      .condition-groups {
        padding: 0;
      }
      .condition-group {
        // background-color: rgb(46, 46, 46);
        border: 1px solid #33343a;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }
      .group-name {
        margin-bottom: 1.5rem;
      }
      .group-name-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .form-field {
        margin-bottom: 1rem;
      }
      .form-field label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #aaa;
      }
      .required {
        color: #f44336;
        margin-left: 2px;
      }
      .form-field input {
        width: 100%;
        background-color: var(--color-nodes-input-bg);
        border: 1px solid var(--color-divider-subtle);
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        color: #fff;
        font-size: 0.875rem;
        outline: none;
      }
      .form-field input.error {
        border-color: rgb(230, 178, 175);
      }
      .error-message {
        color: #f44336;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }
      .form-field input:focus {
        border-color: var(--table-node-accent-color, #685fff);
      }
      .form-field input::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
      .manipulation {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px dashed #33343a;
      }
      .add-btn {
        width: 100%;
        background-color: var(--color-nodes-input-bg);
        color: #fff;
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-divider-subtle);
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .add-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .remove-btn {
        background-color: transparent;
        color: #f44336;
        padding: 0.25rem 0.5rem;
        border: 1px solid #f44336;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-left: 0.5rem;
      }
      .remove-btn:hover {
        background-color: rgba(244, 67, 54, 0.1);
      }
    `,
  ],
})
export class ConditionGroupsFormComponent {
  @Input() set initialGroups(groups: ConditionGroup[]) {
    if (groups) {
      this.setGroups(groups);
    }
  }

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      conditionGroups: this.fb.array([]),
    });
  }

  get conditionGroups() {
    return this.form.get('conditionGroups') as FormArray;
  }

  private createGroupForm(): FormGroup {
    return this.fb.group({
      group_name: ['', [Validators.required]],
      group_type: ['simple'],
      expression: [''],
      conditions: [[]],
      manipulation: [''],
      next_node: [''],
    });
  }

  addGroup() {
    this.conditionGroups.push(this.createGroupForm());
  }

  removeGroup(index: number) {
    this.conditionGroups.removeAt(index);
  }

  private setGroups(groups: ConditionGroup[]) {
    const formGroups = groups.map((group) =>
      this.fb.group({
        group_name: [group.group_name, [Validators.required]],
        group_type: ['simple'],
        expression: [group.expression],
        conditions: [[]],
        manipulation: [group.manipulation],
        next_node: [group.next_node],
      })
    );

    const formArray = this.fb.array(formGroups);
    this.form.setControl('conditionGroups', formArray);
  }

  getConditionGroups(): ConditionGroup[] {
    return this.conditionGroups.value;
  }

  isValid(): boolean {
    return this.form.valid;
  }
}
