import { Injectable } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Observable, map } from 'rxjs';
import {
  ConfirmationDialogData,
  ConfirmationDialogComponent,
  DialogResult,
} from './confirmation-dialog.component';

export type ConfirmationResult = boolean | 'close';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  constructor(private dialog: Dialog) {}

  confirm(options: ConfirmationDialogData): Observable<ConfirmationResult> {
    const dialogRef = this.dialog.open<DialogResult>(
      ConfirmationDialogComponent,
      {
        width: '400px',
        data: options,
      }
    );

    return dialogRef.closed.pipe(
      map((result) => {
        if (!result) return 'close';
        if (result === 'confirm') return true;
        if (result === 'cancel') return false;
        return 'close';
      })
    );
  }

  confirmDelete(itemName: string): Observable<ConfirmationResult> {
    return this.confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete <strong>${itemName}</strong>? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
  }
}
