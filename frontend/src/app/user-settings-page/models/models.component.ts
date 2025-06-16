import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { LLM_Providers_Service } from '../../services/LLM_providers.service';
import { EmbeddingModelsService } from '../../services/embeddings.service';
import { Subscription, forkJoin } from 'rxjs';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { LLM_Provider } from '../../shared/models/LLM_provider.model';
import { LLM_Model } from '../../shared/models/LLM.model';
import { ModelDetailsModalComponent } from './model-details-modal/model-details-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgFor, NgIf } from '@angular/common';

export interface ExtendedLLMModel extends LLM_Model {
  activated: boolean;
  isEmbedding: boolean;
  template: boolean;
  embedding_provider?: number;
  customName?: string;
  apiKey?: string;
}

interface ProviderModels {
  provider: LLM_Provider;
  models: ExtendedLLMModel[];
  setupedModels: ExtendedLLMModel[];
}

@Component({
  selector: 'app-models',
  templateUrl: './models.component.html',
  styleUrls: ['./models.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgClass, NgIf, NgFor],
})
export class ModelsComponent implements OnInit, OnDestroy {
  public providersWithModels: ProviderModels[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private modelsService: LLM_Models_Service,
    private providersService: LLM_Providers_Service,
    private embeddingModelsService: EmbeddingModelsService,
    private snackbarService: SharedSnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      forkJoin({
        providers: this.providersService.getProviders(),
        models: this.modelsService.getLLMModels(),
        embeddingModels: this.embeddingModelsService.getEmbeddingModels(),
      }).subscribe({
        next: ({ providers, models, embeddingModels }) => {
          // Setuped models are empty initially
          const setupedModels: ExtendedLLMModel[] = [];

          // Create template models from fetched models
          // LLM Models
          const allLLMModels: ExtendedLLMModel[] = models.map((model) => ({
            ...model,
            activated: false,
            isEmbedding: false,
            template: true,
          }));

          // Embedding Models
          const allEmbeddingModels: ExtendedLLMModel[] = embeddingModels.map(
            (embeddingModel) => ({
              id: embeddingModel.id,
              name: embeddingModel.name,
              description: null,
              base_url: embeddingModel.base_url || null,
              deployment: embeddingModel.deployment || null,
              llm_provider: embeddingModel.embedding_provider || 0,
              embedding_provider: embeddingModel.embedding_provider || 0,
              activated: false,
              isEmbedding: true,
              template: true,
            })
          );

          // Combine all template models
          const allTemplateModels: ExtendedLLMModel[] = [
            ...allLLMModels,
            ...allEmbeddingModels,
          ];

          // Group models by provider
          this.providersWithModels = providers
            .map((provider) => {
              // Template models for this provider
              const templateModels: ExtendedLLMModel[] =
                allTemplateModels.filter(
                  (model) => model.llm_provider === provider.id
                );

              // Setuped models for this provider (empty initially)
              const providerSetupedModels: ExtendedLLMModel[] = [];

              // Only include providers with at least one template model
              if (templateModels.length === 0) {
                return null;
              }

              return {
                provider,
                models: templateModels,
                setupedModels: providerSetupedModels,
              };
            })
            .filter((group): group is ProviderModels => group !== null)
            .sort((a, b) => {
              if (a.provider.name.toLowerCase() === 'openai') return -1;
              if (b.provider.name.toLowerCase() === 'openai') return 1;
              return a.provider.name.localeCompare(b.provider.name);
            });
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

  private isAzureProvider(providerName: string): boolean {
    return providerName.toLowerCase() === 'azure_openai';
  }

  openModelDetails(model: ExtendedLLMModel, providerName: string): void {
    const isAzure = this.isAzureProvider(providerName);

    const dialogRef = this.dialog.open(ModelDetailsModalComponent, {
      width: '500px',
      data: {
        model,
        providerName,
        isAzure,
        isEditMode: false, // Indicate that we're in create mode
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newSetupedModel: ExtendedLLMModel = {
          ...model,
          customName: result.customName,
          activated: result.activated,
          template: false, // Not a template anymore
          isEmbedding: model.isEmbedding, // Preserve isEmbedding flag
          base_url: result.base_url || model.base_url,
          deployment: result.deployment || model.deployment,
          apiKey: result.apiKey || model.apiKey,
        };

        // Find the provider group
        const providerGroup: ProviderModels | undefined =
          this.providersWithModels.find(
            (group) => group.provider.name === providerName
          );
        if (providerGroup) {
          providerGroup.setupedModels.push(newSetupedModel);
        }
      }
    });
  }

  configureModel(model: ExtendedLLMModel, providerName: string): void {
    const isAzure = this.isAzureProvider(providerName);

    const dialogRef = this.dialog.open(ModelDetailsModalComponent, {
      width: '500px',
      data: {
        model,
        providerName,
        isAzure,
        isEditMode: true, // Indicate that we're in edit mode
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Update the existing model in the setupedModels array
        const providerGroup = this.providersWithModels.find(
          (group) => group.provider.name === providerName
        );
        if (providerGroup) {
          const index = providerGroup.setupedModels.findIndex(
            (m) => m.id === model.id
          );
          if (index !== -1) {
            providerGroup.setupedModels[index] = {
              ...providerGroup.setupedModels[index],
              ...result, // Update with new values
            };
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
