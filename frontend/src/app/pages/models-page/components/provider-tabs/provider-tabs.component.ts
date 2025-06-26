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
import { LLM_Provider } from '../../../../features/settings-dialog/models/LLM_provider.model';
import {
  ModelsPageService,
  ProviderTabType,
} from '../../services/models-page.service';
import { FullLLMConfig } from '../../../../features/settings-dialog/services/llms/full-llm-config.service';
import { FullEmbeddingConfig } from '../../../../features/settings-dialog/services/embeddings/full-embedding.service';
import { FullRealtimeConfig } from '../../../../features/settings-dialog/services/realtime-llms/full-reamtime-config.service';
import { LLM_Config_Service } from '../../../../features/settings-dialog/services/llms/LLM_config.service';
import { EmbeddingConfigsService } from '../../../../features/settings-dialog/services/embeddings/embedding_configs.service';
import { RealtimeModelConfigsService } from '../../../../features/settings-dialog/services/realtime-llms/real-time-model-config.service';
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
  templateUrl: './provider-tabs.component.html',
  styleUrls: ['./provider-tabs.component.scss'],
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

  onConfigureModel(event: Event, config: any): void {
    event.stopPropagation();

    if (this.activeTab === 'llm') {
      this.configureLLMModel(config);
    } else if (this.activeTab === 'embedding') {
      this.configureEmbeddingModel(config);
    } else if (this.activeTab === 'realtime') {
      this.configureRealtimeModel(config);
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

  private configureLLMModel(config: FullLLMConfig): void {
    if (!config.id) {
      console.error('Cannot configure LLM model: No ID provided');
      return;
    }

    // Get available models for this provider
    const availableModels = this.modelsPageService
      .llmModels()
      .filter((model) => model.llm_provider === this.provider.id);

    // Open add LLM dialog with explicit type parameter - in edit mode
    const dialogRef = this.dialog.open<FullLLMConfig>(AddLLMDialogComponent, {
      data: {
        provider: this.provider,
        models: availableModels,
        existingConfig: config,
        isEditMode: true,
      } as AddLLMDialogData,
    });

    // Handle dialog result with correct typing
    dialogRef.closed.subscribe({
      next: (result) => {
        // Cast the result to the expected type
        const updatedConfig = result as FullLLMConfig | undefined;
        if (updatedConfig) {
          console.log('LLM config updated successfully:', updatedConfig);
          // Add updateLLMConfig method to ModelsPageService
          this.modelsPageService.updateLLMConfig(updatedConfig);
        }
      },
    });
  }

  private configureEmbeddingModel(config: FullEmbeddingConfig): void {
    if (!config.id) {
      console.error('Cannot configure Embedding model: No ID provided');
      return;
    }

    console.log('Configure Embedding model:', config);
    // Implement configuration logic for Embedding models
    // This could open a dialog or navigate to a configuration page
  }

  private configureRealtimeModel(config: FullRealtimeConfig): void {
    if (!config.id) {
      console.error('Cannot configure Realtime model: No ID provided');
      return;
    }

    console.log('Configure Realtime model:', config);
    // Implement configuration logic for Realtime models
    // This could open a dialog or navigate to a configuration page
  }
}
