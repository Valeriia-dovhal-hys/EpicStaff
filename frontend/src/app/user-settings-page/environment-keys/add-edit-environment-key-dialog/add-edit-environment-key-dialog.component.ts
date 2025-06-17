import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

interface EnvironmentKeyDialogData {
  key?: string;
  value?: string;
}

@Component({
    selector: 'app-add-edit-environment-key-dialog',
    templateUrl: './add-edit-environment-key-dialog.component.html',
    styleUrls: ['./add-edit-environment-key-dialog.component.scss'],
    imports: [ReactiveFormsModule, NgIf, MatIconModule]
})
export class AddEditEnvironmentKeyDialogComponent implements OnInit {
  keyForm!: FormGroup;
  showValue = false; // Toggles value visibility

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EnvironmentKeyDialogData,
    private dialogRef: MatDialogRef<AddEditEnvironmentKeyDialogComponent>,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.keyForm = this.fb.group({
      key: [
        { value: this.data.key || '', disabled: this.data.key },
        [Validators.required, Validators.maxLength(50)],
      ],
      value: [this.data.value || '', [Validators.required]],
    });
  }

  toggleValueVisibility(): void {
    this.showValue = !this.showValue;
  }

  onSave(): void {
    if (this.keyForm.valid) {
      const keyControl = this.keyForm.get('key');
      let key: string;

      if (keyControl?.disabled) {
        key = this.data.key!;
      } else {
        key = keyControl?.value;
      }

      const value = this.keyForm.get('value')?.value;
      this.dialogRef.close({ key, value });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
