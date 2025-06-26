import { Injectable, signal, inject } from '@angular/core';
import {
  FullEmbeddingConfig,
  FullEmbeddingConfigService,
} from '../../../features/settings-dialog/services/embeddings/full-embedding.service';
import {
  FullLLMConfig,
  FullLLMConfigService,
} from '../../../features/settings-dialog/services/llms/full-llm-config.service';
import { PROVIDERS } from '../../../shared/constants/llm_providers';
import { LLM_Provider } from '../../../features/settings-dialog/models/LLM_provider.model';
import {
  GetLlmModelRequest,
  LLM_Model,
} from '../../../features/settings-dialog/models/llms/LLM.model';
import { EmbeddingModel } from '../../../features/settings-dialog/models/embeddings/embedding.model';
import { forkJoin, Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { LLM_Models_Service } from '../../../features/settings-dialog/services/llms/LLM_models.service';
import { EmbeddingModelsService } from '../../../features/settings-dialog/services/embeddings/embeddings.service';
import { FullRealtimeConfig } from '../../../features/settings-dialog/services/realtime-llms/full-reamtime-config.service';
import { RealtimeModel } from '../../../features/settings-dialog/services/realtime-llms/real-time-models.service';

// Define possible tab names
export type ProviderTabType = 'llm' | 'embedding' | 'realtime';

@Injectable({
  providedIn: 'root',
})
export class ModelsPageService {
  //-------------------------------------------------
  // DATA SIGNALS
  //-------------------------------------------------

  // Provider signals
  public providers = signal<LLM_Provider[]>(PROVIDERS);

  // LLM signals
  public llmConfigs = signal<FullLLMConfig[]>([]);
  public llmModels = signal<GetLlmModelRequest[]>([]);

  // Embedding signals
  public embeddingConfigs = signal<FullEmbeddingConfig[]>([]);
  public embeddingModels = signal<EmbeddingModel[]>([]);

  // Realtime signals
  public realtimeConfigs = signal<FullRealtimeConfig[]>([]);
  public realtimeModels = signal<RealtimeModel[]>([]);

  // UI state signals
  public loading = signal<boolean>(false);
  public expandedProviderId = signal<number | null>(null);

  // Map to store active tab for each provider
  private activeProviderTabs = new Map<number, ProviderTabType>();

  //-------------------------------------------------
  // DATA SETTERS
  //-------------------------------------------------
  setProviders(providers: LLM_Provider[]): void {
    this.providers.set(providers);
  }

  setLLMModels(models: LLM_Model[]): void {
    this.llmModels.set(models);
  }
  setLLMConfigs(configs: FullLLMConfig[]): void {
    this.llmConfigs.set(configs);
  }

  // Embedding setters
  setEmbeddingConfigs(configs: FullEmbeddingConfig[]): void {
    this.embeddingConfigs.set(configs);
  }

  setEmbeddingModels(models: EmbeddingModel[]): void {
    this.embeddingModels.set(models);
  }

  // Realtime setters
  setRealtimeConfigs(configs: FullRealtimeConfig[]): void {
    this.realtimeConfigs.set(configs);
  }

  setRealtimeModels(models: RealtimeModel[]): void {
    this.realtimeModels.set(models);
  }

  //add llm config
  addLLMConfig(config: FullLLMConfig): void {
    this.llmConfigs.update((configs) => [...configs, config]);
  }
  // Add embedding config
  addEmbeddingConfig(config: FullEmbeddingConfig): void {
    this.embeddingConfigs.update((configs) => [...configs, config]);
  }
  addRealtimeConfig(config: FullRealtimeConfig): void {
    this.realtimeConfigs.update((configs) => [...configs, config]);
  }
  //-------------------------------------------------
  // UI STATE MANAGEMENT
  //-------------------------------------------------

  setExpandedProvider(providerId: number | null): void {
    this.expandedProviderId.set(providerId);
  }

  isProviderExpanded(providerId: number): boolean {
    return this.expandedProviderId() === providerId;
  }

  // Active tab methods
  setActiveTab(providerId: number, tabType: ProviderTabType): void {
    this.activeProviderTabs.set(providerId, tabType);
  }

  getActiveTab(providerId: number): ProviderTabType {
    // Return stored tab or default to 'llm'
    return this.activeProviderTabs.get(providerId) || 'llm';
  }

  //-------------------------------------------------
  // FILTER METHODS - CONFIGS BY PROVIDER
  //-------------------------------------------------

  getLLMConfigsByProvider(providerId: number): FullLLMConfig[] {
    return this.llmConfigs()
      .filter((config) => config.modelDetails?.llm_provider === providerId)
      .sort((a, b) => b.id - a.id);
  }

  getEmbeddingConfigsByProvider(providerId: number): FullEmbeddingConfig[] {
    return this.embeddingConfigs()
      .filter(
        (config) => config.modelDetails?.embedding_provider === providerId
      )
      .sort((a, b) => b.id - a.id);
  }
  getRealtimeConfigsByProvider(providerId: number): FullRealtimeConfig[] {
    const configs = this.realtimeConfigs().filter(
      (config) => config.modelDetails?.provider === providerId
    );
    return configs;
  }

  //-------------------------------------------------
  // FILTER METHODS - MODELS BY PROVIDER
  //-------------------------------------------------

  getLLMModelsByProvider(providerId: number): LLM_Model[] {
    return this.llmModels().filter(
      (model) => model.llm_provider === providerId
    );
  }

  getEmbeddingModelsByProvider(providerId: number): EmbeddingModel[] {
    return this.embeddingModels().filter(
      (model) => model.embedding_provider === providerId
    );
  }

  getRealtimeModelsByProvider(providerId: number): RealtimeModel[] {
    return this.realtimeModels().filter(
      (model) => model.provider === providerId
    );
  }

  //-------------------------------------------------
  // PRESENCE CHECK METHODS
  //-------------------------------------------------

  hasLLMModels(providerId: number): boolean {
    return this.llmModels().some((model) => model.llm_provider === providerId);
  }

  hasEmbeddingModels(providerId: number): boolean {
    return this.embeddingModels().some(
      (model) => model.embedding_provider === providerId
    );
  }

  hasRealtimeModels(providerId: number): boolean {
    return this.realtimeModels().some((model) => model.provider === providerId);
  }

  //-------------------------------------------------
  // REMOVAL METHODS
  //-------------------------------------------------

  removeLLMConfigById(id: number): void {
    this.llmConfigs.update((configs) =>
      configs.filter((config) => config.id !== id)
    );
  }

  removeEmbeddingConfigById(id: number): void {
    this.embeddingConfigs.update((configs) =>
      configs.filter((config) => config.id !== id)
    );
  }

  removeRealtimeConfigById(id: number): void {
    this.realtimeConfigs.update((configs) =>
      configs.filter((config) => config.id !== id)
    );
  }

  //update configs
  updateLLMConfig(updatedConfig: FullLLMConfig): void {
    this.llmConfigs.update((configs) => {
      return configs.map((config) =>
        config.id === updatedConfig.id ? updatedConfig : config
      );
    });
  }
}
