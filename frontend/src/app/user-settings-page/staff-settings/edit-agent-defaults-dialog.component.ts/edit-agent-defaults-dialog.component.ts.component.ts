// src/app/components/staff-settings/edit-agent-defaults-dialog/edit-agent-defaults-dialog.component.ts

import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import {
  AgentDefaults,
  UpdateAgentDefaultsRequest,
} from '../../../services/mock/agent-defaults.model';
import { AgentDefaultsService } from '../../../services/mock/agent-defaults.service';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';
import { LLM_Config } from '../../../shared/models/LLM_config.model';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-edit-agent-defaults-dialog',
    templateUrl: './edit-agent-defaults-dialog.component.html',
    styleUrls: ['./edit-agent-defaults-dialog.component.scss'],
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatInputModule,
        MatButtonModule,
        NgFor,
        NgIf,
        ReactiveFormsModule,
        MatIconModule,
    ]
})
export class EditAgentDefaultsDialogComponent implements OnDestroy {
  public agentDefaultsForm: FormGroup;
  public llmConfigs: LLM_Config[] = [];
  private subscriptions: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<EditAgentDefaultsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private agentDefaultsService: AgentDefaultsService,
    private snackbarService: SharedSnackbarService
  ) {
    this.llmConfigs = data.llmConfigs.filter(
      (config: LLM_Config) => config.is_visible
    );

    // Remove required validators for llm_config_id and fcm_llm_config_id
    // so that "None" (empty string) is allowed
    this.agentDefaultsForm = this.fb.group({
      allow_delegation: [
        data.agentDefaults.allow_delegation,
        Validators.required,
      ],
      memory: [data.agentDefaults.memory, Validators.required],
      max_iter: [
        data.agentDefaults.max_iter,
        [Validators.required, Validators.min(1)],
      ],
      llm_config_id: [data.llmConfig?.id || ''],
      fcm_llm_config_id: [data.functionLLMConfig?.id || ''],
    });
  }

  onSave(): void {
    if (this.agentDefaultsForm.valid) {
      // Convert empty string to null for consistency
      let selectedLLMConfigId =
        this.agentDefaultsForm.value.llm_config_id || null;
      let selectedFunctionConfigId =
        this.agentDefaultsForm.value.fcm_llm_config_id || null;

      // Convert to numbers if not null
      selectedLLMConfigId = selectedLLMConfigId ? +selectedLLMConfigId : null;
      selectedFunctionConfigId = selectedFunctionConfigId
        ? +selectedFunctionConfigId
        : null;

      const selectedLLMConfig: LLM_Config | undefined = this.llmConfigs.find(
        (config) => config.id === selectedLLMConfigId
      );

      const selectedFunctionConfig: LLM_Config | undefined =
        this.llmConfigs.find(
          (config) => config.id === selectedFunctionConfigId
        );

      // Build the request object similar to how it's done in project settings
      const updatedAgentDefaultsRequest: UpdateAgentDefaultsRequest = {
        allow_delegation: this.agentDefaultsForm.value.allow_delegation,
        memory: this.agentDefaultsForm.value.memory,
        max_iter: this.agentDefaultsForm.value.max_iter,
        llm_config: selectedLLMConfigId,
        fcm_llm_config: selectedFunctionConfigId,
      };

      console.log(
        'Updated Agent Defaults Request:',
        updatedAgentDefaultsRequest
      );

      const updateSubscription = this.agentDefaultsService
        .updateAgentDefaults(updatedAgentDefaultsRequest)
        .subscribe({
          next: (updatedDefaults) => {
            console.log('Updated Defaults:', updatedDefaults);
            console.log('Selected LLM Config:', selectedLLMConfig);
            console.log(
              'Selected Function LLM Config:',
              selectedFunctionConfig
            );

            const result = {
              agentDefaults: updatedDefaults,
              llmConfig: selectedLLMConfig,
              functionLLMConfig: selectedFunctionConfig,
            };

            this.snackbarService.showSnackbar(
              'Agent defaults updated successfully.',
              'success'
            );

            this.dialogRef.close(result);
          },
          error: (error) => {
            console.error('Failed to update agent defaults', error);
            this.snackbarService.showSnackbar(
              'Failed to update agent defaults.',
              'error'
            );
          },
        });

      this.subscriptions.add(updateSubscription);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
