import { Injectable } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Observable, map } from 'rxjs';
import {
  ConfirmationDialogData,
  ConfirmationDialogComponent,
} from './confirmation-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  constructor(private dialog: Dialog) {}

  confirm(options: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open<boolean>(ConfirmationDialogComponent, {
      width: '400px',
      data: options,
      // Add custom backdrop class here
    });

    // Map undefined to false to ensure we always return a boolean
    return dialogRef.closed.pipe(map((result) => result === true));
  }

  confirmDelete(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete <strong>${itemName}</strong>? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
  }
}
