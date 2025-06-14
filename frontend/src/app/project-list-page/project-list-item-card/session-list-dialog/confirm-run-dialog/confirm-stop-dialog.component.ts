import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-confirm-stop-dialog',
  templateUrl: './confirm-stop-dialog.component.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmStopDialogComponent {
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmStopDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title?: string;
      message?: string;
      confirmButtonText?: string;
      cancelButtonText?: string;
    }
  ) {
    // Set default values or use data passed in
    this.title = data.title || 'Confirm';
    this.message = data.message || 'Are you sure?';
    this.confirmButtonText = data.confirmButtonText || 'OK';
    this.cancelButtonText = data.cancelButtonText || 'Cancel';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
