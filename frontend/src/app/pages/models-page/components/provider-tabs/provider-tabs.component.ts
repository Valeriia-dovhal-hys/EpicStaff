import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { LLM_Provider } from '../../../../shared/models/LLM_provider.model';
import {
  ModelsPageService,
  ProviderTabType,
} from '../../services/models-page.service';
import { FullLLMConfig } from '../../../../services/full-llm-config.service';
import { FullEmbeddingConfig } from '../../../../services/full-embedding.service';
import { FullRealtimeConfig } from '../../services/realtime-models-services/full-reamtime-config.service';
import { LLM_Config_Service } from '../../../../services/LLM_config.service';
import { EmbeddingConfigsService } from '../../../../services/embedding_configs.service';
import { RealtimeModelConfigsService } from '../../services/realtime-models-services/real-time-model-config.service';
import { ModelSearchComponent } from '../model-search/model-search.component';
import { AddModelButtonComponent } from '../add-model-button/add-model-button.component';
import {
  AddLLMDialogComponent,
  AddLLMDialogData,
} from './add-llm-dialog/add-llm-dialog.component';
import {
  AddEmbeddingDialogComponent,
  AddEmbeddingDialogData,
} from './add-embedding-dialog/add-embedding-dialog.component';
import {
  AddRealtimeDialogComponent,
  AddRealtimeDialogData,
} from './add-realtime-dialog/add-realtime-dialog.component';

@Component({
  selector: 'app-provider-tabs',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ModelSearchComponent,
    AddModelButtonComponent,
  ],
  template: `
    <div class="tabs-container">
      <div class="tabs-header">
        <button
          class="tab-button"
          [class.active]="activeTab === 'llm'"
          (click)="selectTab('llm')"
        >
          LLM Models ({{ llmModelsCount }})
        </button>
        @if(this.modelsPageService.hasEmbeddingModels(provider.id)){
        <button
          class="tab-button"
          [class.active]="activeTab === 'embedding'"
          (click)="selectTab('embedding')"
        >
          Embedding Models ({{ embeddingModelsCount }})
        </button>
        } @if(this.modelsPageService.hasRealtimeModels(provider.id)){
        <button
          class="tab-button"
          [class.active]="activeTab === 'realtime'"
          (click)="selectTab('realtime')"
        >
          Realtime Models ({{ realtimeModelsCount }})
        </button>
        }
      </div>

      <div class="tab-content">
        @if (activeTab === 'llm') {
        <div class="tab-actions">
          <app-model-search
            placeholder="Search LLM models..."
            (search)="onSearchLLM($event)"
          ></app-model-search>
          <app-add-model-button
            buttonText="Add LLM"
            (add)="onAddLLM()"
          ></app-add-model-button>
        </div>
        <div class="models-list">
          @if (filteredLLMConfigs().length === 0) {
          <div class="no-models">
            @if(llmSearchTerm() && llmModelsCount > 0) { No matching LLM models
            found } @else { No LLM models created}
          </div>
          } @else { @for (config of filteredLLMConfigs(); track config.id) {
          <div class="model-item">
            <div class="model-info">
              <div class="model-name">{{ config.modelDetails?.name }}</div>
              <div class="model-custom-name">{{ config.custom_name }}</div>
            </div>
            <div class="model-actions">
              <button
                class="action-btn delete-btn"
                (click)="onDeleteModel($event, config)"
              >
                <i class="ti ti-x"></i>
              </button>
            </div>
          </div>
          } }
        </div>
        } @if (activeTab === 'embedding') {
        <div class="tab-actions">
          <app-model-search
            placeholder="Search embedding models..."
            (search)="onSearchEmbedding($event)"
          ></app-model-search>
          <app-add-model-button
            buttonText="Add Embedding"
            (add)="onAddEmbedding()"
          ></app-add-model-button>
        </div>
        <div class="models-list">
          @if (filteredEmbeddingConfigs().length === 0) {
          <div class="no-models">
            @if(embeddingSearchTerm() && embeddingModelsCount > 0) { No matching
            embedding models found } @else { No embedding models created }
          </div>
          } @else { @for (config of filteredEmbeddingConfigs(); track config.id)
          {
          <div class="model-item">
            <div class="model-info">
              <div class="model-name">{{ config.modelDetails?.name }}</div>
              <div class="model-custom-name">{{ config.custom_name }}</div>
            </div>
            <div class="model-actions">
              <button
                class="action-btn delete-btn"
                (click)="onDeleteModel($event, config)"
              >
                <i class="ti ti-x"></i>
              </button>
            </div>
          </div>
          } }
        </div>
        } @if (activeTab === 'realtime') {
        <div class="tab-actions">
          <app-model-search
            placeholder="Search realtime models..."
            (search)="onSearchRealtime($event)"
          ></app-model-search>
          <app-add-model-button
            buttonText="Add Realtime"
            (add)="onAddRealtime()"
          ></app-add-model-button>
        </div>
        <div class="models-list">
          @if (filteredRealtimeConfigs().length === 0) {
          <div class="no-models">
            @if(realtimeSearchTerm() && realtimeModelsCount > 0) { No matching
            realtime models found } @else { No realtime models created }
          </div>
          } @else { @for (config of filteredRealtimeConfigs(); track config.id)
          {
          <div class="model-item">
            <div class="model-info">
              <div class="model-name">{{ config.modelDetails?.name }}</div>
              <div class="model-custom-name">{{ config.custom_name }}</div>
            </div>
            <div class="model-actions">
              <button
                class="action-btn delete-btn"
                (click)="onDeleteModel($event, config)"
              >
                <i class="ti ti-x"></i>
              </button>
            </div>
          </div>
          } }
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .tabs-container {
        display: flex;
        flex-direction: column;
        width: 100%;

        .tabs-header {
          display: flex;
          border-bottom: 1px solid var(--gray-700);
          margin-bottom: 1rem;

          .tab-button {
            background: transparent;
            border: none;
            color: var(--gray-400);
            padding: 0.5rem 1rem;
            cursor: pointer;
            position: relative;
            font-size: 14px;

            &:hover {
              color: var(--gray-100);
            }

            &.active {
              color: var(--accent-color);

              &:after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                width: 100%;
                height: 2px;
                background-color: var(--accent-color);
              }
            }
          }
        }

        .tab-content {
          padding: 0;

          .tab-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            gap: 1rem;
          }
        }

        .models-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;

          .model-item {
            padding: 0.75rem;
            background-color: var(--gray-800);
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .model-info {
              .model-name {
                line-height: 1;
                font-weight: 500;
                margin-bottom: 0.5rem;
                color: var(--gray-100);
              }

              .model-custom-name {
                font-size: 14px;
                color: var(--gray-400);
              }
            }

            .model-actions {
              display: flex;
              gap: 0.5rem;

              .action-btn {
                background-color: transparent;
                border-radius: 4px;
                padding: 0.25rem 0.75rem;
                color: var(--gray-300);
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: all 0.2s ease;

                &:hover {
                  background-color: var(--gray-700);
                  color: var(--gray-100);
                }

                &.delete-btn {
                  padding: 0.25rem;

                  &:hover {
                    background-color: var(--gray-700);
                    color: white;
                  }

                  i {
                    font-size: 14px;
                    width: 14px;
                    height: 14px;
                  }
                }
              }
            }
          }

          .no-models {
            color: var(--gray-500);
            font-style: italic;
            padding: 1rem 0;
            text-align: center;
            width: 100%;
            display: flex;
            justify-content: center;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderTabsComponent {
  @Input() provider!: LLM_Provider;
  @Input() activeTab: ProviderTabType = 'llm';
  @Output() tabChange = new EventEmitter<ProviderTabType>();

  private dialog = inject(Dialog);
  modelsPageService = inject(ModelsPageService);
  llmConfigService = inject(LLM_Config_Service);
  embeddingConfigService = inject(EmbeddingConfigsService);
  realtimeConfigService = inject(RealtimeModelConfigsService);

  // Search terms for filtering
  llmSearchTerm = signal<string>('');
  embeddingSearchTerm = signal<string>('');
  realtimeSearchTerm = signal<string>('');

  // Helper getters for model counts
  get llmModelsCount(): number {
    return this.modelsPageService.getLLMConfigsByProvider(this.provider.id)
      .length;
  }

  get embeddingModelsCount(): number {
    return this.modelsPageService.getEmbeddingConfigsByProvider(
      this.provider.id
    ).length;
  }

  get realtimeModelsCount(): number {
    return this.modelsPageService.getRealtimeConfigsByProvider(this.provider.id)
      .length;
  }

  // Filtered configs based on search terms
  filteredLLMConfigs() {
    const configs = this.modelsPageService.getLLMConfigsByProvider(
      this.provider.id
    );
    const searchTerm = this.llmSearchTerm().toLowerCase().trim();

    if (!searchTerm) {
      return configs;
    }

    return configs.filter(
      (config) =>
        config.modelDetails?.name?.toLowerCase().includes(searchTerm) ||
        config.custom_name?.toLowerCase().includes(searchTerm)
    );
  }

  filteredEmbeddingConfigs() {
    const configs = this.modelsPageService.getEmbeddingConfigsByProvider(
      this.provider.id
    );
    const searchTerm = this.embeddingSearchTerm().toLowerCase().trim();

    if (!searchTerm) {
      return configs;
    }

    return configs.filter(
      (config) =>
        config.modelDetails?.name?.toLowerCase().includes(searchTerm) ||
        config.custom_name?.toLowerCase().includes(searchTerm)
    );
  }

  filteredRealtimeConfigs() {
    const configs = this.modelsPageService.getRealtimeConfigsByProvider(
      this.provider.id
    );
    const searchTerm = this.realtimeSearchTerm().toLowerCase().trim();

    if (!searchTerm) {
      return configs;
    }

    return configs.filter((config) =>
      config.modelDetails?.name?.toLowerCase().includes(searchTerm)
    );
  }

  selectTab(tabType: ProviderTabType): void {
    if (this.activeTab !== tabType) {
      this.activeTab = tabType;
      this.tabChange.emit(tabType);
    }
  }

  onDeleteModel(event: Event, config: any): void {
    event.stopPropagation();

    if (this.activeTab === 'llm') {
      this.deleteLLMConfig(config);
    } else if (this.activeTab === 'embedding') {
      this.deleteEmbeddingConfig(config);
    } else if (this.activeTab === 'realtime') {
      this.deleteRealtimeConfig(config);
    }
  }

  onSearchLLM(searchTerm: string): void {
    this.llmSearchTerm.set(searchTerm);
  }

  onSearchEmbedding(searchTerm: string): void {
    this.embeddingSearchTerm.set(searchTerm);
  }

  onSearchRealtime(searchTerm: string): void {
    this.realtimeSearchTerm.set(searchTerm);
  }

  onAddLLM(): void {
    // Get available models for this provider
    const availableModels = this.modelsPageService
      .llmModels()
      .filter((model) => model.llm_provider === this.provider.id);

    // Open add LLM dialog with explicit type parameter
    const dialogRef = this.dialog.open<FullLLMConfig>(AddLLMDialogComponent, {
      data: {
        provider: this.provider,
        models: availableModels,
      } as AddLLMDialogData,
    });

    // Handle dialog result with correct typing
    dialogRef.closed.subscribe({
      next: (result) => {
        // Cast the result to the expected type
        const fullConfig = result as FullLLMConfig | undefined;
        if (fullConfig) {
          console.log('LLM config created successfully:', fullConfig);
          // Add the new config to the ModelsPageService
          this.modelsPageService.addLLMConfig(fullConfig);
        }
      },
    });
  }

  onAddEmbedding(): void {
    // Get available embedding models for this provider
    const availableModels = this.modelsPageService
      .embeddingModels()
      .filter((model) => model.embedding_provider === this.provider.id);

    // Open add Embedding dialog with explicit type parameter
    const dialogRef = this.dialog.open<FullEmbeddingConfig>(
      AddEmbeddingDialogComponent,
      {
        data: {
          provider: this.provider,
          models: availableModels,
        } as AddEmbeddingDialogData,
      }
    );

    // Handle dialog result with correct typing
    dialogRef.closed.subscribe({
      next: (result) => {
        // Cast the result to the expected type
        const fullConfig = result as FullEmbeddingConfig | undefined;
        if (fullConfig) {
          console.log('Embedding config created successfully:', fullConfig);
          // Add the new config to the ModelsPageService
          this.modelsPageService.addEmbeddingConfig(fullConfig);
        }
      },
    });
  }

  onAddRealtime(): void {
    // Get available realtime models for this provider
    const availableModels = this.modelsPageService
      .realtimeModels()
      .filter((model) => model.provider === this.provider.id);

    // Open add Realtime dialog with explicit type parameter
    const dialogRef = this.dialog.open<FullRealtimeConfig>(
      AddRealtimeDialogComponent,
      {
        data: {
          provider: this.provider,
          models: availableModels,
        } as AddRealtimeDialogData,
      }
    );

    // Handle dialog result with correct typing
    dialogRef.closed.subscribe({
      next: (result) => {
        // Cast the result to the expected type
        const fullConfig = result as FullRealtimeConfig | undefined;
        if (fullConfig) {
          console.log('Realtime config created successfully:', fullConfig);
          // Add the new config to the ModelsPageService
          this.modelsPageService.addRealtimeConfig(fullConfig);
        }
      },
    });
  }

  private deleteLLMConfig(config: FullLLMConfig): void {
    if (!config.id) {
      console.error('Cannot delete LLM config: No ID provided');
      return;
    }

    this.llmConfigService.deleteConfig(config.id).subscribe({
      next: () => {
        console.log('LLM config deleted successfully:', config.id);
        // Update the state in the ModelsPageService
        this.modelsPageService.removeLLMConfigById(config.id!);
      },
      error: (error) => {
        console.error('Error deleting LLM config:', error);
      },
    });
  }

  private deleteEmbeddingConfig(config: FullEmbeddingConfig): void {
    if (!config.id) {
      console.error('Cannot delete Embedding config: No ID provided');
      return;
    }

    this.embeddingConfigService.deleteEmbeddingConfig(config.id).subscribe({
      next: () => {
        console.log('Embedding config deleted successfully:', config.id);
        // Update the state in the ModelsPageService
        this.modelsPageService.removeEmbeddingConfigById(config.id!);
      },
      error: (error) => {
        console.error('Error deleting Embedding config:', error);
      },
    });
  }

  private deleteRealtimeConfig(config: FullRealtimeConfig): void {
    if (!config.id) {
      console.error('Cannot delete Realtime config: No ID provided');
      return;
    }

    this.realtimeConfigService.deleteConfig(config.id).subscribe({
      next: () => {
        console.log('Realtime config deleted successfully:', config.id);
        // Update the state in the ModelsPageService
        this.modelsPageService.removeRealtimeConfigById(config.id!);
      },
      error: (error) => {
        console.error('Error deleting Realtime config:', error);
      },
    });
  }
}
