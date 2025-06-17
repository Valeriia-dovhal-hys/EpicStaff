import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  EnvironmentKeysService,
  EnvironmentKey,
} from '../../services/environment-keys.service';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { AddEditEnvironmentKeyDialogComponent } from './add-edit-environment-key-dialog/add-edit-environment-key-dialog.component';

import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { ConfirmDialogComponent } from '../models/confirm-delete-model-dialog/confirm-delete-model-dialog.component';

@Component({
  selector: 'app-environment-keys',
  imports: [
    NgIf,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
  ],
  templateUrl: './environment-keys.component.html',
  styleUrls: ['./environment-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentKeysComponent implements OnInit, AfterViewInit {
  public environmentKeys: EnvironmentKey[] = [];
  public isLoading: boolean = true;
  public visibilityStates: { [key: string]: boolean } = {};
  public allVisible: boolean = false;

  public displayedColumns: string[] = ['key', 'value', 'actions'];
  public dataSource = new MatTableDataSource<EnvironmentKey>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private environmentKeysService: EnvironmentKeysService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef, // Injected ChangeDetectorRef
    private snackbarService: SharedSnackbarService // Injected SharedSnackbarService
  ) {}

  public ngOnInit(): void {
    this.fetchEnvironmentKeys();
  }

  public ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private fetchEnvironmentKeys(): void {
    this.environmentKeysService.getEnvironmentKeys().subscribe({
      next: (keys: { [key: string]: string }) => {
        this.environmentKeys = Object.entries(keys).map(([key, value]) => ({
          key,
          value: value as string,
        }));
        this.dataSource.data = this.environmentKeys;
        this.environmentKeys.forEach((keyPair) => {
          this.visibilityStates[keyPair.key] = false;
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching environment keys:', error);
        this.isLoading = false;
        this.snackbarService.showSnackbar(
          'Error fetching environment keys',
          'error'
        );
        this.cdr.markForCheck(); // Mark for change detection
      },
    });
  }

  public toggleVisibility(key: string): void {
    if (this.allVisible) {
      // Switch from 'allVisible' mode to individual visibility mode
      this.allVisible = false;

      // Set all keys to visible except the toggled key
      this.environmentKeys.forEach((keyPair) => {
        this.visibilityStates[keyPair.key] = true;
      });

      // Set the toggled key to hidden
      this.visibilityStates[key] = false;
    } else {
      // Toggle the visibility state of the key
      this.visibilityStates[key] = !this.visibilityStates[key];
    }
    this.cdr.markForCheck(); // Mark for change detection
  }

  public toggleAllVisibility(): void {
    this.allVisible = !this.allVisible;

    if (this.allVisible) {
      // Reset individual visibility states when showing all
      this.environmentKeys.forEach((keyPair) => {
        this.visibilityStates[keyPair.key] = false;
      });
    }
    this.cdr.markForCheck(); // Mark for change detection
  }

  public openAddEditDialog(keyPair?: EnvironmentKey): void {
    const dialogRef = this.dialog.open(AddEditEnvironmentKeyDialogComponent, {
      width: '700px',
      data: keyPair ? { ...keyPair } : {},
      backdropClass: 'custom-dialog-backdrop', // Add this line
    });

    dialogRef.afterClosed().subscribe((result: EnvironmentKey | undefined) => {
      if (result) {
        this.addOrUpdateEnvironmentKey(result);
      }
    });
  }

  private addOrUpdateEnvironmentKey(updatedKey: EnvironmentKey): void {
    this.environmentKeysService
      .addOrUpdateEnvironmentKey(updatedKey)
      .subscribe({
        next: () => {
          const index = this.environmentKeys.findIndex(
            (item) => item.key === updatedKey.key
          );
          if (index !== -1) {
            // Update existing key
            this.environmentKeys[index] = updatedKey;
          } else {
            // Add new key
            this.environmentKeys.push(updatedKey);
          }
          this.dataSource.data = [...this.environmentKeys];
          this.visibilityStates[updatedKey.key] = false;
          this.snackbarService.showSnackbar(
            'Environment key saved successfully',
            'success'
          );
          this.cdr.markForCheck(); // Mark for change detection
        },
        error: (error) => {
          console.error('Error adding/updating environment key:', error);
          this.snackbarService.showSnackbar(
            'Error saving environment key',
            'error'
          );
          this.cdr.markForCheck(); // Mark for change detection
        },
      });
  }

  public deleteEnvironmentKey(key: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',

      data: {
        title: 'Delete Key',
        message: `Are you sure you want to delete the key "${key}"?`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // User clicked 'Delete'
        this.environmentKeysService.deleteEnvironmentKey(key).subscribe({
          next: () => {
            this.environmentKeys = this.environmentKeys.filter(
              (item) => item.key !== key
            );
            this.dataSource.data = [...this.environmentKeys];
            delete this.visibilityStates[key];
            this.snackbarService.showSnackbar(
              'Environment key deleted successfully',
              'success'
            );
            this.cdr.markForCheck(); // Mark for change detection
          },
          error: (error) => {
            console.error('Error deleting environment key:', error);
            this.snackbarService.showSnackbar(
              'Error deleting environment key',
              'error'
            );
            this.cdr.markForCheck(); // Mark for change detection
          },
        });
      }
    });
  }
}
