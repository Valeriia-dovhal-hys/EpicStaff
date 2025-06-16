import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { LLM_Providers_Service } from '../../services/LLM_providers.service';
import { EmbeddingModelsService } from '../../services/embeddings.service';
import { LLM_Model } from '../../shared/models/LLM.model';
import { EmbeddingModel } from '../../shared/models/embedding.model';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { LLM_Provider } from '../../shared/models/LLM_provider.model';
import { ModelDetailsModalComponent } from './model-details-modal/model-details-modal.component';
import { MatIconModule } from '@angular/material/icon';

interface ActivatedModel {
  name: string;
  activated: boolean;
  isEmbedding: boolean;
  // Include other necessary properties
}

interface ProviderModels {
  provider: LLM_Provider;
  models: ActivatedModel[];
  embeddingModels: ActivatedModel[];
  activatedModels: ActivatedModel[];
}

@Component({
  selector: 'app-models',
  templateUrl: './models.component.html',
  styleUrls: ['./models.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule],
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
          this.providersWithModels = providers
            .map((provider) => {
              const providerLLMModels = models
                .filter((model) => model.llm_provider === provider.id)
                .map((model) => ({
                  ...model,
                  activated: Math.random() < 0.5, // Mock activation status
                  isEmbedding: false, // Not an embedding model
                }));

              const providerEmbeddingModels = embeddingModels
                .filter(
                  (embeddingModel) =>
                    embeddingModel.embedding_provider === provider.id
                )
                .map((model) => ({
                  ...model,
                  activated: Math.random() < 0.5, // Mock activation status
                  isEmbedding: true, // Is an embedding model
                }));

              const allModels = [
                ...providerLLMModels,
                ...providerEmbeddingModels,
              ];

              // Only include providers with at least one model
              if (allModels.length === 0) {
                return null;
              }

              return {
                provider,
                models: providerLLMModels,
                embeddingModels: providerEmbeddingModels,
                activatedModels: allModels,
              };
            })
            .filter((group) => group !== null)
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openModelDetails(model: ActivatedModel, providerName: string): void {
    this.dialog.open(ModelDetailsModalComponent, {
      width: '500px',
      data: { model, providerName, isEmbedding: model.isEmbedding },
      panelClass: 'custom-modal',
    });
  }
}
