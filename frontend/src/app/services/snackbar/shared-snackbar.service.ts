import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SharedSnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  showSnackbar(
    message: string,
    type: 'success' | 'error',
    duration: number = 3000
  ) {
    console.log(`Snackbar Message: ${message}, Type: ${type}`);
    const panelClass =
      type === 'success' ? ['snackbar-success'] : ['snackbar-error'];

    this.snackBar.open(message, 'Close', {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: panelClass,
    });
  }
}
