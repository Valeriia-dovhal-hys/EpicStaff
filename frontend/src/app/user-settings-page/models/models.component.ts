import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { LLM_Providers_Service } from '../../services/LLM_providers.service';
import { EmbeddingModelsService } from '../../services/embeddings.service';
import { LLM_Config_Service } from '../../services/LLM_config.service';
import { Subscription, forkJoin } from 'rxjs';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { LLM_Provider } from '../../shared/models/LLM_provider.model';
import { LLM_Model } from '../../shared/models/LLM.model';
import { EmbeddingModel } from '../../shared/models/embedding.model';
import { LLM_Config } from '../../shared/models/LLM_config.model';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { LLMConfigDialogComponent } from './llm-config-dialog/llm-config-dialog.component';
import { ConfirmDialogComponent } from './confirm-delete-model-dialog/confirm-delete-model-dialog.component';
import { EmbeddingConfig } from '../../shared/models/embedding-config.model';
import { EmbeddingConfigsService } from '../../services/embedding_configs.service';
import { EmbeddingConfigDialogComponent } from './embedding-config-dialog/embedding-config-dialog.component';
import { PageHeaderComponent } from '../../shared/components/header/page-header.component';

interface ProviderModels {
  provider: LLM_Provider;
  models: ModelWithConfigs[];
  embeddingModels: EmbeddingModelWithConfigs[];
}

interface ModelWithConfigs extends LLM_Model {
  configs: LLM_Config[];
  expandedConfigs: boolean;
}

interface EmbeddingModelWithConfigs extends EmbeddingModel {
  configs: EmbeddingConfig[];
  expandedConfigs: boolean;
}

@Component({
  selector: 'app-models',
  standalone: true,
  templateUrl: './models.component.html',
  styleUrls: ['./models.component.scss'],
  imports: [MatIconModule, NgClass, NgIf, NgFor, PageHeaderComponent],
})
export class ModelsComponent implements OnInit, OnDestroy {
  public providersWithModels: ProviderModels[] = [];
  public expandedProviders: boolean[] = []; // Tracks visibility of each provider's section

  private subscription: Subscription = new Subscription();
  public isLoaded: boolean = false;
  constructor(
    private modelsService: LLM_Models_Service,
    private providersService: LLM_Providers_Service,
    private embeddingModelsService: EmbeddingModelsService,
    private configService: LLM_Config_Service,
    private snackbarService: SharedSnackbarService,
    private dialog: MatDialog,
    private embeddingConfigsService: EmbeddingConfigsService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      forkJoin({
        providers: this.providersService.getProviders(),
        models: this.modelsService.getLLMModels(),
        embeddingModels: this.embeddingModelsService.getEmbeddingModels(),
        configs: this.configService.getAllConfigsLLM(),
        embeddingConfigs: this.embeddingConfigsService.getEmbeddingConfigs(),
      }).subscribe({
        next: ({
          providers,
          models,
          embeddingModels,
          configs,
          embeddingConfigs,
        }) => {
          // Assign descriptions to providers
          providers.forEach((provider: LLM_Provider) => {
            if (provider.name.toLowerCase() === 'groq') {
              provider.description =
                'Focused on high-performance AI models. Includes models like GroqFlow.';
            } else if (provider.name.toLowerCase() === 'ollama') {
              provider.description =
                'Specializes in fine-tuned AI models. Includes models like OllamaGPT.';
            } else if (provider.name.toLowerCase() === 'huggingface') {
              provider.description =
                'Offers a wide range of NLP models. Includes models like BERT, RoBERTa, and DistilBERT.';
            } else if (provider.name.toLowerCase() === 'anthropic') {
              provider.description =
                'Developer of safe AI models. Includes models like Claude 2 and Claude Instant.';
            } else if (provider.name.toLowerCase() === 'openai_compatible') {
              provider.description =
                'Compatible with OpenAI API standards. Includes models like GPT-style APIs.';
            } else if (provider.name.toLowerCase() === 'azure_openai') {
              provider.description =
                'Azure-hosted OpenAI services. Includes models like GPT-3.5 and GPT-4.';
            } else if (provider.name.toLowerCase() === 'openai') {
              provider.description =
                'Leading AI provider. Includes models like GPT-4, GPT-3.5-turbo, and Ada for embeddings.';
            } else {
              provider.description =
                'A trusted AI provider offering various models.';
            }
          });

          // Map configs by model ID
          const configsByModelId = new Map<number, LLM_Config[]>();
          configs.forEach((config) => {
            if (!configsByModelId.has(config.model)) {
              configsByModelId.set(config.model, []);
            }
            configsByModelId.get(config.model)!.push(config);
          });

          // Map embedding configs by model ID
          const embeddingConfigsByModelId = new Map<
            number,
            EmbeddingConfig[]
          >();
          embeddingConfigs.forEach((config) => {
            if (!embeddingConfigsByModelId.has(config.model)) {
              embeddingConfigsByModelId.set(config.model, []);
            }
            embeddingConfigsByModelId.get(config.model)!.push(config);
          });

          // Map models and embedding models to their providers
          this.providersWithModels = providers
            .map((provider) => {
              const providerModels: ModelWithConfigs[] = models
                .filter((model) => model.llm_provider === provider.id)
                .map((model) => ({
                  ...model,
                  configs: configsByModelId.get(model.id) || [],
                  expandedConfigs: false,
                }));

              const providerEmbeddingModels: EmbeddingModelWithConfigs[] =
                embeddingModels
                  .filter((em) => em.embedding_provider === provider.id)
                  .map((embeddingModel) => ({
                    ...embeddingModel,
                    configs:
                      embeddingConfigsByModelId.get(embeddingModel.id) || [],
                    expandedConfigs: false,
                  }));

              if (
                providerModels.length === 0 &&
                providerEmbeddingModels.length === 0
              ) {
                return null;
              }

              return {
                provider: provider,
                models: providerModels,
                embeddingModels: providerEmbeddingModels,
              };
            })
            .filter((group): group is ProviderModels => group !== null);

          // Sort providers
          this.providersWithModels.sort((a, b) => {
            if (a.provider.name.toLowerCase() === 'openai') return -1;
            if (b.provider.name.toLowerCase() === 'openai') return 1;
            return a.provider.name.localeCompare(b.provider.name);
          });

          this.isLoaded = true;
        },
        error: (err) => {
          console.error('Error fetching data:', err);
          this.snackbarService.showSnackbar(
            'Failed to load models and providers.',
            'error'
          );
        },
      })
    );
  }

  public addModelConfiguration(
    model: ModelWithConfigs,
    event: MouseEvent
  ): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(LLMConfigDialogComponent, {
      width: '700px',
      data: { modelId: model.id, modelName: model.name },
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.afterClosed().subscribe((result: LLM_Config | undefined) => {
      if (result) {
        model.configs.push(result);
      }
    });
  }

  public configureConfig(model: ModelWithConfigs, config: LLM_Config): void {
    const dialogRef = this.dialog.open(LLMConfigDialogComponent, {
      width: '700px',
      data: { modelId: model.id, config: config, modelName: model.name },
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.afterClosed().subscribe((result: LLM_Config | undefined) => {
      if (result) {
        const index = model.configs.findIndex((c) => c.id === result.id);
        if (index !== -1) {
          model.configs[index] = result;
        }
      }
    });
  }

  public toggleEmbeddingModelConfigs(
    embeddingModel: EmbeddingModelWithConfigs
  ): void {
    embeddingModel.expandedConfigs = !embeddingModel.expandedConfigs;
  }

  public deleteEmbeddingConfig(
    embeddingModel: EmbeddingModelWithConfigs,
    config: EmbeddingConfig
  ): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '700px',
      data: {
        title: 'Delete Configuration',
        message: `Are you sure you want to delete the configuration with ID "${config.id}"?`,
      },
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.embeddingConfigsService
          .deleteEmbeddingConfig(config.id)
          .subscribe({
            next: () => {
              const index = embeddingModel.configs.findIndex(
                (c) => c.id === config.id
              );
              if (index !== -1) {
                embeddingModel.configs.splice(index, 1);
                this.snackbarService.showSnackbar(
                  'Configuration deleted successfully.',
                  'success'
                );
              }
            },
            error: (error) => {
              console.error('Failed to delete configuration', error);
              this.snackbarService.showSnackbar(
                'Failed to delete configuration.',
                'error'
              );
            },
          });
      }
    });
  }

  public configureEmbeddingConfig(
    embeddingModel: EmbeddingModelWithConfigs,
    config: EmbeddingConfig
  ): void {
    const dialogRef = this.dialog.open(EmbeddingConfigDialogComponent, {
      width: '700px',
      data: {
        modelId: embeddingModel.id,
        config: config,
        modelName: embeddingModel.name,
      },
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.afterClosed().subscribe((result: EmbeddingConfig | undefined) => {
      if (result) {
        const index = embeddingModel.configs.findIndex(
          (c) => c.id === result.id
        );
        if (index !== -1) {
          embeddingModel.configs[index] = result;
        }
      }
    });
  }

  public addEmbeddingConfiguration(
    embeddingModel: EmbeddingModelWithConfigs,
    event: MouseEvent
  ): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(EmbeddingConfigDialogComponent, {
      width: '700px',
      data: { modelId: embeddingModel.id, modelName: embeddingModel.name },
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.afterClosed().subscribe((result: EmbeddingConfig | undefined) => {
      if (result) {
        embeddingModel.configs.push(result);
      }
    });
  }

  public deleteConfig(model: ModelWithConfigs, config: LLM_Config): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Configuration',
        message: `Are you sure you want to delete the configuration "${config.custom_name}"?`,
      },
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.configService.deleteConfig(config.id).subscribe({
          next: () => {
            const index = model.configs.findIndex((c) => c.id === config.id);
            if (index !== -1) {
              model.configs.splice(index, 1);
              this.snackbarService.showSnackbar(
                'Configuration deleted successfully.',
                'success'
              );
            }
          },
          error: (error) => {
            console.error('Failed to delete configuration', error);
            this.snackbarService.showSnackbar(
              'Failed to delete configuration.',
              'error'
            );
          },
        });
      }
    });
  }

  toggleProviderVisibility(index: number): void {
    this.expandedProviders[index] = !this.expandedProviders[index];
  }

  toggleModelConfigs(model: ModelWithConfigs): void {
    model.expandedConfigs = !model.expandedConfigs;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
