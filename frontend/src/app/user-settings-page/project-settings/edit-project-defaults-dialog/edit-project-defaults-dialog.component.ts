// src/app/components/project-settings/edit-project-defaults-dialog.component.ts
import {
  Component,
  Inject,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ProjectDefaultsService } from '../../../services/mock/project-defaults.service';

import { EmbeddingModel } from '../../../shared/models/embedding.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UpdateProjectDefaultsRequest } from '../../../services/mock/project-defaults.model';
import { MatSelect } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';
import { LLM_Config } from '../../../shared/models/LLM_config.model';
import { EmbeddingConfig } from '../../../shared/models/embedding-config.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-edit-project-defaults-dialog',
    templateUrl: './edit-project-defaults-dialog.component.html',
    styleUrls: ['./edit-project-defaults-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatFormFieldModule,
        MatOptionModule,
        MatButtonModule,
        NgFor,
        MatDialogModule,
        ReactiveFormsModule,
        MatIconModule,
    ]
})
export class EditProjectDefaultsDialogComponent implements OnDestroy {
  public projectDefaultsForm: FormGroup;
  public llmConfigs: LLM_Config[] = [];
  public embeddingConfigs: EmbeddingConfig[] = [];
  private subscriptions: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<EditProjectDefaultsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private projectDefaultsService: ProjectDefaultsService,
    private snackbarService: SharedSnackbarService
  ) {
    this.llmConfigs = data.llmConfigs;
    this.embeddingConfigs = data.embeddingConfigs;

    this.projectDefaultsForm = this.fb.group({
      processType: [data.projectDefaults.process, Validators.required],
      memory: [data.projectDefaults.memory, Validators.required],
      managerLLMConfigId: [
        data.selectedLLMConfig &&
        this.llmConfigs.find((c) => c.id === data.selectedLLMConfig.id)
          ? data.selectedLLMConfig.id
          : '', // If not found or null, use ""
      ],
      embeddingConfigId: [
        data.selectedEmbeddingConfig &&
        this.embeddingConfigs.find(
          (c) => c.id === data.selectedEmbeddingConfig.id
        )
          ? data.selectedEmbeddingConfig.id
          : '', // If not found or null, use ""
      ],
    });

    this.llmConfigs = this.llmConfigs.filter((config) => config.is_visible);
    this.embeddingConfigs = this.embeddingConfigs.filter(
      (config) => config.is_visible
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public onSave(): void {
    if (this.projectDefaultsForm.valid) {
      let selectedLLMConfigId =
        this.projectDefaultsForm.value.managerLLMConfigId || null;
      let selectedEmbeddingConfigId =
        this.projectDefaultsForm.value.embeddingConfigId || null;

      // Ensure selected IDs are consistent with the type in llmConfigs and embeddingConfigs
      selectedLLMConfigId = selectedLLMConfigId ? +selectedLLMConfigId : null;
      selectedEmbeddingConfigId = selectedEmbeddingConfigId
        ? +selectedEmbeddingConfigId
        : null;

      console.log('Filtered LLM Configs:', this.llmConfigs);
      console.log('Selected LLM Config ID:', selectedLLMConfigId);

      const selectedLLMConfig: LLM_Config | undefined = this.llmConfigs.find(
        (config) => config.id === selectedLLMConfigId
      );

      const selectedEmbeddingConfig: EmbeddingConfig | undefined =
        this.embeddingConfigs.find(
          (config) => config.id === selectedEmbeddingConfigId
        );

      const updatedDefaultsRequest: UpdateProjectDefaultsRequest = {
        process: this.projectDefaultsForm.value.processType,
        memory: this.projectDefaultsForm.value.memory,
        manager_llm_config: selectedLLMConfigId,
        embedding_config: selectedEmbeddingConfigId,
      };

      console.log('Updated Defaults Request:', updatedDefaultsRequest);

      const updateSubscription = this.projectDefaultsService
        .updateProjectDefaults(updatedDefaultsRequest)
        .subscribe({
          next: (updatedDefaults) => {
            console.log('Updated Defaults:', updatedDefaults);
            console.log('Selected LLM Config:', selectedLLMConfig);

            const result = {
              projectDefaults: updatedDefaults,
              selectedLLMConfig: selectedLLMConfig,
              selectedEmbeddingConfig: selectedEmbeddingConfig,
            };

            this.snackbarService.showSnackbar(
              'Project defaults updated successfully.',
              'success'
            );

            this.dialogRef.close(result);
          },
          error: (error) => {
            console.error('Failed to update project defaults', error);

            this.snackbarService.showSnackbar(
              'Failed to update project defaults.',
              'error'
            );
          },
        });

      this.subscriptions.add(updateSubscription);
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
