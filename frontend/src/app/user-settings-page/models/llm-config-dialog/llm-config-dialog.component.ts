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
import {
  LLM_Config,
  CreateLLMConfigRequest,
  UpdateLLMConfigRequest,
} from '../../../shared/models/LLM_config.model';
import { LLM_Config_Service } from '../../../services/LLM_config.service';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-llm-config-dialog',
    templateUrl: './llm-config-dialog.component.html',
    styleUrls: ['./llm-config-dialog.component.scss'],
    imports: [
        MatDialogModule,
        ReactiveFormsModule,
        CommonModule,
        MatButtonModule,
        MatIconModule,
    ]
})
export class LLMConfigDialogComponent implements OnInit {
  public configForm: FormGroup;
  public isEditMode: boolean;
  public showApiKey: boolean = false; // For toggling API Key visibility

  constructor(
    public dialogRef: MatDialogRef<LLMConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { modelId: number; config?: LLM_Config; modelName: string },
    private fb: FormBuilder,
    private llmConfigService: LLM_Config_Service,
    private snackbarService: SharedSnackbarService
  ) {
    this.isEditMode = !!data.config;

    this.configForm = this.fb.group({
      custom_name: [
        data.config?.custom_name || '',
        [Validators.required, Validators.minLength(3)],
      ],
      temperature: [
        data.config?.temperature || 0.7,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1),
          Validators.pattern('^[0-9]+(\\.[0-9]+)?$'),
        ],
      ],
      num_ctx: [
        data.config?.num_ctx || 25,
        [
          Validators.required,
          Validators.min(1),
          Validators.pattern('^[0-9]+$'),
        ],
      ],
      api_key: [data.config?.api_key || '', [Validators.required]],
      is_visible: [this.data.config?.is_visible ?? true],
    });
  }

  ngOnInit(): void {}

  get customNameControl(): AbstractControl | null {
    return this.configForm.get('custom_name');
  }

  get temperatureControl(): AbstractControl | null {
    return this.configForm.get('temperature');
  }

  get numCtxControl(): AbstractControl | null {
    return this.configForm.get('num_ctx');
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
        const updateRequest: UpdateLLMConfigRequest = {
          id: this.data.config.id,
          ...this.configForm.value,
          model: this.data.modelId,
        };
        this.llmConfigService.updateConfig(updateRequest).subscribe({
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
        const createRequest: CreateLLMConfigRequest = {
          ...this.configForm.value,
          model: this.data.modelId,
        };
        this.llmConfigService.createConfig(createRequest).subscribe({
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
