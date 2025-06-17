import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-dialog',
    template: `
    <div class="dark-dialog">
      <div class="dialog-title">
        {{ data.title }}
      </div>
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div class="dialog-actions">
        <button class="cancel-button" (click)="onCloseClick()">
          {{ data.cancelButtonText || 'Cancel' }}
        </button>
        <button class="confirm-button" (click)="onDeleteClick()">
          {{ data.confirmButtonText || 'Delete' }}
        </button>
      </div>
    </div>
  `,
    styles: [
        `
      :host {
        --accent-color: #9a73af;
        --border-color: #2a2a2a;
        --muted-text-color: #cccccc;
        --dialog-bg-color: #1a1a1a;
        --text-color: #ffffff;
      }

      .dark-dialog {
        background-color: var(--dialog-bg-color);
        color: var(--text-color);
        padding: 1.5rem;
        border-radius: 0.5rem;
        max-width: 500px;
        margin: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
      }

      .dialog-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 1rem;
        color: var(--text-color);
      }

      .dialog-content {
        margin-bottom: 1.5rem;
        font-size: 1rem;
        color: var(--muted-text-color);
      }

      .dialog-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      .cancel-button {
        background: transparent;
        color: var(--text-color);
        border: 1px solid var(--text-color);
        padding: 0.75rem 1.25rem;
        border-radius: 0.375rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s, color 0.2s;
        text-transform: none;

        &:hover {
          background-color: #2a2a2a;
          border-color: var(--accent-color);
          color: var(--accent-color);
        }
      }

      .confirm-button {
        background-color: var(--accent-color);
        color: var(--text-color);
        border: none;
        padding: 0.75rem 1.25rem;
        border-radius: 0.375rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: #b384c7;
        }
      }
    `,
    ],
    standalone: false
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      message: string;
      cancelButtonText?: string;
      confirmButtonText?: string;
    }
  ) {}

  onDeleteClick(): void {
    this.dialogRef.close(true);
  }

  onCloseClick(): void {
    this.dialogRef.close(false);
  }
}
