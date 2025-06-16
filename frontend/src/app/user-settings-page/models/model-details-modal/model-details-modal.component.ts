import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { ExtendedLLMModel } from '../models.component';

interface ModelDialogData {
  model: ExtendedLLMModel;
  providerName: string;
  isAzure: boolean;
  isEditMode?: boolean;
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
  isEmbedding: boolean;
  isAzure: boolean;
  isEditMode: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModelDialogData,
    private dialogRef: MatDialogRef<ModelDetailsModalComponent>,
    private fb: FormBuilder
  ) {
    this.isEmbedding = data.model.isEmbedding;
    this.isAzure = data.isAzure;
    this.isEditMode = data.isEditMode || false;
  }

  ngOnInit(): void {
    const model = this.data.model;

    if (this.isAzure) {
      // Form for Azure provider with pre-filled data
      this.modelForm = this.fb.group({
        customName: [
          model.customName || model.name,
          [Validators.required, Validators.maxLength(50)],
        ],
        base_url: [model.base_url || '', [Validators.required]],
        deployment: [model.deployment || '', [Validators.required]],
        activated: [model.activated !== undefined ? model.activated : true],
      });
    } else {
      // Form for other providers with pre-filled data
      this.modelForm = this.fb.group({
        customName: [
          model.customName || model.name,
          [Validators.required, Validators.maxLength(50)],
        ],
        apiKey: [
          model.apiKey || '',
          [Validators.required, Validators.minLength(8)],
        ],
        activated: [model.activated !== undefined ? model.activated : true],
      });
    }
  }

  onSave(): void {
    if (this.modelForm.valid) {
      this.dialogRef.close({
        ...this.modelForm.value,
        isEmbedding: this.isEmbedding,
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
