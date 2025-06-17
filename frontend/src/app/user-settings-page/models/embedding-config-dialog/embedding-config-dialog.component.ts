import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';

import { EmbeddingConfigsService } from '../../../services/embedding_configs.service';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  CreateEmbeddingConfigRequest,
  EmbeddingConfig,
} from '../../../shared/models/embedding-config.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-embedding-config-dialog',
    templateUrl: './embedding-config-dialog.component.html',
    styleUrls: ['./embedding-config-dialog.component.scss'],
    imports: [
        MatDialogModule,
        ReactiveFormsModule,
        CommonModule,
        MatButtonModule,
        MatIconModule,
    ]
})
export class EmbeddingConfigDialogComponent implements OnInit {
  public configForm: FormGroup;
  public isEditMode: boolean;
  public showApiKey: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EmbeddingConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      modelId: number;
      config?: EmbeddingConfig;
      modelName: string;
    },
    private fb: FormBuilder,
    private embeddingConfigService: EmbeddingConfigsService,
    private snackbarService: SharedSnackbarService
  ) {
    this.isEditMode = !!data.config;

    this.configForm = this.fb.group({
      task_type: [
        data.config?.task_type || 'retrieval_document',
        [Validators.required],
      ],
      custom_name: [data.config?.custom_name || '', [Validators.required]],
      api_key: [data.config?.api_key || '', [Validators.required]],
      is_visible: [data.config?.is_visible ?? true],
    });
  }

  ngOnInit(): void {}

  get taskTypeControl(): AbstractControl | null {
    return this.configForm.get('task_type');
  }

  get customNameControl(): AbstractControl | null {
    return this.configForm.get('custom_name');
  }

  get apiKeyControl(): AbstractControl | null {
    return this.configForm.get('api_key');
  }

  public toggleApiKeyVisibility(): void {
    this.showApiKey = !this.showApiKey;
  }

  public onSave(): void {
    if (this.configForm.valid) {
      if (this.isEditMode && this.data.config) {
        const updateRequest: EmbeddingConfig = {
          id: this.data.config.id,
          ...this.configForm.value,
          model: this.data.modelId,
        };
        this.embeddingConfigService
          .updateEmbeddingConfig(updateRequest)
          .subscribe({
            next: (updatedConfig) => {
              this.snackbarService.showSnackbar(
                'Configuration updated successfully.',
                'success'
              );
              this.dialogRef.close(updatedConfig);
            },
            error: (error) => {
              console.error('Failed to update configuration', error);
              this.snackbarService.showSnackbar(
                'Failed to update configuration.',
                'error'
              );
            },
          });
      } else {
        const createRequest: CreateEmbeddingConfigRequest = {
          ...this.configForm.value,
          model: this.data.modelId,
        };
        this.embeddingConfigService
          .createEmbeddingConfig(createRequest)
          .subscribe({
            next: (newConfig) => {
              this.snackbarService.showSnackbar(
                'Configuration created successfully.',
                'success'
              );
              this.dialogRef.close(newConfig);
            },
            error: (error) => {
              console.error('Failed to create configuration', error);
              this.snackbarService.showSnackbar(
                'Failed to create configuration.',
                'error'
              );
            },
          });
      }
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
