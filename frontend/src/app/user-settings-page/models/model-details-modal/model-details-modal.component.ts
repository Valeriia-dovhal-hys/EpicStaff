import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

interface ModelDialogData {
  model: {
    name: string;
    id: number;
    description: string | null;
    base_url: string | null;
    deployment: string | null;
    llm_provider: number;
    providerName?: string;
  };
  providerName: string;
}

@Component({
  selector: 'app-model-details-modal',
  standalone: true,
  templateUrl: './model-details-modal.component.html',
  styleUrls: ['./model-details-modal.component.scss'],
  imports: [ReactiveFormsModule, NgIf],
})
export class ModelDetailsModalComponent implements OnInit {
  modelForm!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModelDialogData,
    private dialogRef: MatDialogRef<ModelDetailsModalComponent>,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.modelForm = this.fb.group({
      customName: ['', [Validators.required, Validators.maxLength(50)]],
      apiKey: ['', [Validators.required, Validators.minLength(8)]],
      activated: [false],
    });
  }

  onCreate(): void {
    if (this.modelForm.valid) {
      console.log('Form Submitted:', this.modelForm.value);
      this.dialogRef.close(this.modelForm.value);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
