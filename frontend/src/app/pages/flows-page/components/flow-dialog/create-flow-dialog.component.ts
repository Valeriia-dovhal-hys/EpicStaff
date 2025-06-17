import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { GraphDto } from '../../models/graph.model';

export interface FlowDialogData {
  isEdit: boolean;
  flow?: GraphDto;
}

@Component({
  selector: 'app-create-flow-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">{{ dialogTitle }}</h2>
        <button class="close-button" (click)="onCancel()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="dialog-content">
        <form [formGroup]="flowForm">
          <div class="form-group">
            <label for="name">Flow Name</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              placeholder="Enter flow name"
              class="text-input"
            />
            @if (flowForm.get('name')?.invalid && flowForm.get('name')?.dirty) {
            <div class="error-message">Flow name is required.</div>
            }
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              formControlName="description"
              placeholder="Enter flow description (optional)"
              class="text-input"
            ></textarea>
          </div>
        </form>
      </div>

      <div class="dialog-footer">
        <button class="button secondary" (click)="onCancel()">Cancel</button>
        <button
          class="button primary"
          [disabled]="!flowForm.valid"
          (click)="onSubmit()"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        background-color: #1e1e1e;
        border-radius: 12px;
        padding: 24px;
        color: rgba(255, 255, 255, 0.9);
        min-width: 400px;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .dialog-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          margin-left: 10px;
          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
          }
        }
      }

      .dialog-content {
        margin-bottom: 24px;
      }

      .form-group {
        margin-bottom: 16px;

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .text-input {
          width: 100%;
          padding: 10px 12px;
          background-color: rgba(30, 30, 30, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: white;
          font-size: 14px;
          transition: border-color 0.2s ease;
          resize: vertical;

          &:focus {
            outline: none;
            border-color: #685fff;
          }
        }

        .error-message {
          font-size: 12px;
          color: #ff4d4f;
          margin-top: 4px;
        }
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .button {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border: none;

        &.secondary {
          background-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);

          &:hover {
            background-color: rgba(255, 255, 255, 0.15);
          }
        }

        &.primary {
          background-color: #685fff;
          color: white;

          &:hover {
            background-color: #7a70ff;
          }

          &:disabled {
            background-color: rgba(104, 95, 255, 0.5);
            cursor: not-allowed;
          }
        }
      }
    `,
  ],
})
export class CreateFlowDialogComponent implements OnInit {
  flowForm: FormGroup;
  isEditMode = false;
  dialogTitle = 'Create New Flow';
  submitButtonText = 'Create';
  // Store the original flow data to preserve fields we don't edit in the UI
  originalFlow?: GraphDto;

  constructor(
    public dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) public data: FlowDialogData
  ) {
    this.flowForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      description: new FormControl(''),
    });

    if (data && data.isEdit && data.flow) {
      this.isEditMode = true;
      this.dialogTitle = 'Edit Flow';
      this.submitButtonText = 'Save';
      this.originalFlow = data.flow;
    }
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.flow) {
      this.flowForm.patchValue({
        name: this.data.flow.name,
        description: this.data.flow.description || '',
      });
    }
  }

  onSubmit(): void {
    if (this.flowForm.valid) {
      if (this.isEditMode && this.originalFlow) {
        // For edit mode, preserve all original properties and only update name and description
        this.dialogRef.close({
          ...this.originalFlow,
          name: this.flowForm.value.name,
          description: this.flowForm.value.description || '',
        });
      } else {
        // For create mode, just pass the form values
        this.dialogRef.close({
          ...this.flowForm.value,
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
