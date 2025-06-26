import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { DialogRef } from '@angular/cdk/dialog';

// RxJS imports
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { EmbeddingConfigsService } from '../../../../features/settings-dialog/services/embeddings/embedding_configs.service';
import { EmbeddingModelsService } from '../../../../features/settings-dialog/services/embeddings/embeddings.service';
import { LLM_Config_Service } from '../../../../features/settings-dialog/services/llms/LLM_config.service';
import { LLM_Models_Service } from '../../../../features/settings-dialog/services/llms/LLM_models.service';
import { ToastService } from '../../../../services/notifications/toast.service';
import { TranscriptionConfigsService } from '../../../../services/transcription-config.service';
import { GetRealtimeTranscriptionModelRequest } from '../../../../services/transcription-models.service';
import {
  EmbeddingConfig,
  CreateEmbeddingConfigRequest,
} from '../../../../features/settings-dialog/models/embeddings/embedding-config.model';
import { EmbeddingModel } from '../../../../features/settings-dialog/models/embeddings/embedding.model';
import { GetLlmModelRequest } from '../../../../features/settings-dialog/models/llms/LLM.model';
import { CreateLLMConfigRequest } from '../../../../features/settings-dialog/models/llms/LLM_config.model';
import { CreateTranscriptionConfigRequest } from '../../../../shared/models/transcription-config.model';
import { RealtimeModelConfigsService } from '../../../../features/settings-dialog/services/realtime-llms/real-time-model-config.service';
import { RealtimeModelsService } from '../../../../features/settings-dialog/services/realtime-llms/real-time-models.service';
import { Router } from '@angular/router';
import { RealtimeModel } from '../../../../features/settings-dialog/models/realtime-voice/realtime-model.model';
import { CreateRealtimeModelConfigRequest } from '../../../../features/settings-dialog/models/realtime-voice/realtime-llm-config.model';

interface LLM_Provider {
  id: number;
  name: string;
}

@Component({
  selector: 'app-quick-start-tab',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule],
  template: `
    <div class="quick-start-container">
      <form [formGroup]="quickStartForm">
        <div class="form-group">
          <div class="provider-label">
            <label for="apiKey"> Please provide an API Key for the </label>
            <div class="provider-selector">
              <button
                type="button"
                class="provider-button"
                (click)="toggleProviderDropdown()"
              >
                <img
                  [src]="'assets/icons/' + selectedProvider.name + '-logo.svg'"
                  alt="Provider logo"
                  class="provider-logo"
                />
                {{ formatProviderName(selectedProvider.name) }}
                <i *ngIf="!showProviderDropdown" class="ti ti-chevron-down"></i>
                <i *ngIf="showProviderDropdown" class="ti ti-chevron-up"></i>
              </button>

              <div *ngIf="showProviderDropdown" class="provider-dropdown">
                <div
                  *ngFor="let provider of providers"
                  class="provider-option"
                  [class.active]="provider.id === selectedProvider.id"
                  (click)="selectProvider(provider)"
                >
                  <img
                    [src]="'assets/icons/' + provider.name + '-logo.svg'"
                    alt="Provider logo"
                    class="provider-logo"
                  />
                  <span>{{ formatProviderName(provider.name) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="input-with-icon">
            <input
              #apiKeyInput
              type="text"
              id="apiKey"
              formControlName="apiKey"
              [placeholder]="
                'Enter ' +
                formatProviderName(selectedProvider.name) +
                ' API key'
              "
              class="text-input"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-lpignore="true"
              data-form-type="other"
            />
            <button
              type="button"
              class="eye-button"
              (click)="toggleApiKeyVisibility()"
            >
              <svg
                *ngIf="showApiKey"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M3 3L21 21"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                *ngIf="!showApiKey"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <div class="api-key-description">
            <p>This API key will be used to quickly auto create:</p>
            <ul class="description-list">
              <li>
                <span class="bullet">•</span> Models and tools configurations
              </li>
              <li><span class="bullet">•</span> Realtime configs</li>
              <li><span class="bullet">•</span> Embeddings configs</li>
              <li><span class="bullet">•</span> Model defaults for projects</li>
              <li><span class="bullet">•</span> Model defaults for agents</li>
              <li><span class="bullet">•</span> Model defaults for tools</li>
            </ul>
          </div>
        </div>
      </form>

      <div class="dialog-footer">
        <button type="button" class="button secondary" (click)="onCancel()">
          Cancel
        </button>
        <button
          type="button"
          class="button primary"
          [disabled]="!quickStartForm.get('apiKey')?.value"
          (click)="onQuickStart()"
        >
          <div *ngIf="isSaving" class="loader-container">
            <svg class="spinner" viewBox="0 0 50 50">
              <circle
                class="path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke-width="5"
              ></circle>
            </svg>
          </div>
          Start Building
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./quick-start-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickStartTabComponent implements AfterViewInit {
  @ViewChild('apiKeyInput') apiKeyInput!: ElementRef<HTMLInputElement>;

  public quickStartForm: FormGroup;
  public showApiKey = false;
  public showProviderDropdown = false;
  public isSaving = false;

  public providers: LLM_Provider[] = [
    { id: 1, name: 'openai' },
    { id: 2, name: 'ollama' },
    { id: 3, name: 'claude' },
    { id: 5, name: 'groq' },
    { id: 6, name: 'huggingface' },
  ];

  public selectedProvider: LLM_Provider = this.providers[0]; // Default to OpenAI

  constructor(
    private dialogRef: DialogRef<string>,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private llmConfigService: LLM_Config_Service,
    private embeddingConfigsService: EmbeddingConfigsService,
    private realtimeModelConfigsService: RealtimeModelConfigsService,
    private llmModelsService: LLM_Models_Service,
    private embeddingModelsService: EmbeddingModelsService,
    private realtimeModelsService: RealtimeModelsService,
    private toastService: ToastService,
    private transcriptionConfigsService: TranscriptionConfigsService,
    private fb: FormBuilder
  ) {
    this.quickStartForm = this.fb.group({
      apiKey: [''],
    });
  }

  ngAfterViewInit(): void {
    // Focus the API key input when component initializes
    setTimeout(() => {
      if (this.apiKeyInput) {
        this.apiKeyInput.nativeElement.focus();
        this.cdr.markForCheck();
      }
    });
  }

  public toggleApiKeyVisibility(): void {
    this.showApiKey = !this.showApiKey;
  }

  public toggleProviderDropdown(): void {
    this.showProviderDropdown = !this.showProviderDropdown;
  }

  public selectProvider(provider: LLM_Provider): void {
    this.selectedProvider = provider;
    this.showProviderDropdown = false;
  }

  public formatProviderName(name: string): string {
    return name
      .replace('_', ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  public onQuickStart(): void {
    const apiKey = this.quickStartForm.get('apiKey')?.value;
    if (apiKey) {
      this.createQuickStartConfigs(apiKey, this.selectedProvider.id);
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  private createQuickStartConfigs(apiKey: string, providerId: number): void {
    this.isSaving = true;
    this.cdr.markForCheck();

    // First get all models from all three services
    forkJoin({
      llmModels: this.llmModelsService.getLLMModels(),
      embeddingModels: this.embeddingModelsService.getEmbeddingModels(),
      realtimeModels: this.realtimeModelsService.getAllModels(),
      realtimeTranscriptionModels: this.realtimeModelsService.getAllModels(),
    })
      .pipe(
        switchMap((modelResults) => {
          // Find models that match the selected provider
          const llmModel: GetLlmModelRequest | undefined =
            modelResults.llmModels.find(
              (model) => model.llm_provider === providerId
            );
          const embeddingModel: EmbeddingModel | undefined =
            modelResults.embeddingModels.find(
              (model) => model.embedding_provider === providerId
            );
          const realtimeModel: RealtimeModel | undefined =
            modelResults.realtimeModels.find(
              (model) => model.provider === providerId
            );

          // Find transcription model that matches the selected provider
          const transcriptionModel:
            | GetRealtimeTranscriptionModelRequest
            | undefined = modelResults.realtimeTranscriptionModels.find(
            (model) => model.provider === providerId
          );

          console.log('Found models for provider', providerId, ':', {
            llmModel: llmModel
              ? `${llmModel.name} (ID: ${llmModel.id})`
              : 'None',
            embeddingModel: embeddingModel
              ? `${embeddingModel.name} (ID: ${embeddingModel.id})`
              : 'None',
            realtimeModel: realtimeModel
              ? `${realtimeModel.name} (ID: ${realtimeModel.id})`
              : 'None',
            transcriptionModel: transcriptionModel
              ? `${transcriptionModel.name} (ID: ${transcriptionModel.id})`
              : 'None',
          });

          // Now fetch existing configurations to check for duplicates
          return forkJoin({
            llmConfigs:
              this.llmConfigService.getConfigsByProviderId(providerId),
            embeddingConfigs:
              this.embeddingConfigsService.getEmbeddingConfigsByProviderId(
                providerId
              ),
            realtimeConfigs:
              this.realtimeModelConfigsService.getConfigsByProviderId(
                providerId
              ),
            transcriptionConfigs:
              this.transcriptionConfigsService.getTranscriptionConfigsByProviderId(
                providerId
              ),
            models: of({
              llm: llmModel,
              embedding: embeddingModel,
              realtime: realtimeModel,
              transcription: transcriptionModel,
            }),
          });
        })
      )
      .subscribe({
        next: (results) => {
          const models = results.models;

          // Create arrays for configs that need to be created
          const configsToCreate: Array<{
            type: string;
            observable: Observable<any>;
          }> = [];
          const skippedConfigs: string[] = [];
          const missingModels: string[] = [];

          // Check and prepare LLM config if needed
          if (models.llm) {
            const existingLlmConfig = results.llmConfigs.find(
              (config) =>
                config.custom_name === 'quickstart' &&
                config.model === models.llm?.id
            );

            if (!existingLlmConfig) {
              const llmConfig: CreateLLMConfigRequest = {
                model: models.llm.id,
                custom_name: 'quickstart',
                api_key: apiKey,
                is_visible: true,
              };
              configsToCreate.push({
                type: 'LLM',
                observable: this.llmConfigService.createConfig(llmConfig),
              });
            } else {
              skippedConfigs.push('LLM');
            }
          } else {
            missingModels.push('LLM');
          }

          // Check and prepare embedding config if needed
          if (models.embedding) {
            const existingEmbeddingConfig: EmbeddingConfig | undefined =
              results.embeddingConfigs.find(
                (config) =>
                  config.custom_name === 'quickstart' &&
                  config.model === models.embedding?.id
              );

            if (!existingEmbeddingConfig) {
              const embeddingConfig: CreateEmbeddingConfigRequest = {
                model: models.embedding.id,
                custom_name: 'quickstart',
                api_key: apiKey,
                task_type: 'retrieval_document',
                is_visible: true,
              };
              configsToCreate.push({
                type: 'Embedding',
                observable:
                  this.embeddingConfigsService.createEmbeddingConfig(
                    embeddingConfig
                  ),
              });
            } else {
              skippedConfigs.push('Embedding');
            }
          } else {
            missingModels.push('Embedding');
          }

          // Check and prepare realtime config if needed
          if (models.realtime) {
            const existingRealtimeConfig = results.realtimeConfigs.find(
              (config) =>
                config.custom_name === 'quickstart' &&
                config.realtime_model === models.realtime?.id
            );

            if (!existingRealtimeConfig) {
              const realtimeConfig: CreateRealtimeModelConfigRequest = {
                realtime_model: models.realtime.id,
                api_key: apiKey,
                custom_name: 'quickstart',
              };
              configsToCreate.push({
                type: 'Realtime',
                observable:
                  this.realtimeModelConfigsService.createConfig(realtimeConfig),
              });
            } else {
              skippedConfigs.push('Realtime');
            }
          } else {
            missingModels.push('Realtime');
          }

          // Check and prepare transcription config if needed
          if (models.transcription) {
            const existingTranscriptionConfig =
              results.transcriptionConfigs.find(
                (config) =>
                  config.custom_name === 'quickstart' &&
                  config.realtime_transcription_model ===
                    models.transcription?.id
              );

            if (!existingTranscriptionConfig) {
              const transcriptionConfig: CreateTranscriptionConfigRequest = {
                realtime_transcription_model: models.transcription.id,
                api_key: apiKey,
                custom_name: 'quickstart',
              };
              configsToCreate.push({
                type: 'Transcription',
                observable:
                  this.transcriptionConfigsService.createTranscriptionConfig(
                    transcriptionConfig
                  ),
              });
            } else {
              skippedConfigs.push('Transcription');
            }
          } else {
            missingModels.push('Transcription');
          }

          // If no configurations need to be created
          if (configsToCreate.length === 0) {
            this.isSaving = false;
            this.cdr.markForCheck();

            if (missingModels.length > 0 && skippedConfigs.length > 0) {
              this.toastService.info(
                `Some models not available for this provider: ${missingModels.join(
                  ', '
                )}. Others already configured: ${skippedConfigs.join(', ')}`
              );
            } else if (missingModels.length > 0) {
              this.toastService.warning(
                `Some models not available for this provider: ${missingModels.join(
                  ', '
                )}`
              );
            } else {
              this.toastService.info(
                'All available quickstart configurations already exist for this provider'
              );
            }
            return;
          }

          // Create only the configs that don't exist yet
          forkJoin(configsToCreate.map((item) => item.observable)).subscribe({
            // Inside the forkJoin subscription's next callback, right before this.dialogRef.close():
            next: (createdResults) => {
              this.isSaving = false;
              this.cdr.markForCheck();

              console.log('QuickStart configurations created:', createdResults);

              let message = '';
              if (configsToCreate.length > 0) {
                const createdTypes = configsToCreate.map((item) => item.type);
                message += `Created: ${createdTypes.join(', ')}. `;
              }

              if (skippedConfigs.length > 0) {
                message += `Already existed: ${skippedConfigs.join(', ')}. `;
              }

              if (missingModels.length > 0) {
                message += `Not available: ${missingModels.join(', ')}. `;
              }
              console.log('triggering suces message');

              // Add the success toast here
              this.toastService.success(
                `QuickStart setup completed`,
                5000,
                'top-center'
              );
              this.router.navigate(['/projects']);

              this.dialogRef.close('quickstart-complete');
            },
            error: (error) => {
              this.isSaving = false;
              this.cdr.markForCheck();

              console.error('Error creating QuickStart configurations:', error);
              this.toastService.error(
                'Failed to create QuickStart configurations'
              );
            },
          });
        },
        error: (error) => {
          this.isSaving = false;
          this.cdr.markForCheck();

          console.error(
            'Error fetching models or checking existing configurations:',
            error
          );
          this.toastService.error('Failed to set up QuickStart configurations');
        },
      });
  }
}
