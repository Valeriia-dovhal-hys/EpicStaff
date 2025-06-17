import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CustomInputComponent } from '../../../../../shared/components/form-input/form-input.component';

export interface RenameCollectionDialogData {
  collectionName: string;
  collectionId: number;
}

@Component({
  selector: 'app-rename-collection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomInputComponent],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">Rename Collection</h2>
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
        <app-custom-input
          [(ngModel)]="newName"
          label="Collection Name"
          id="collectionName"
          name="collectionName"
          placeholder="Enter collection name"
          [autofocus]="true"
        ></app-custom-input>
      </div>

      <div class="dialog-footer">
        <button class="button secondary" (click)="onCancel()">Cancel</button>
        <button
          class="button primary"
          [disabled]="!isValid()"
          (click)="onConfirm()"
        >
          Rename
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

          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
          }
        }
      }

      .dialog-content {
        margin-bottom: 24px;
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
export class RenameCollectionDialogComponent {
  newName: string;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: RenameCollectionDialogData
  ) {
    this.newName = data.collectionName;
  }

  isValid(): boolean {
    return (
      !!this.newName &&
      this.newName.trim() !== '' &&
      this.newName !== this.data.collectionName
    );
  }

  onConfirm(): void {
    if (this.isValid()) {
      this.dialogRef.close(this.newName.trim());
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
