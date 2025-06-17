import { Injectable, signal, inject } from '@angular/core';
import {
  FullEmbeddingConfig,
  FullEmbeddingConfigService,
} from '../../../services/full-embedding.service';
import {
  FullLLMConfig,
  FullLLMConfigService,
} from '../../../services/full-llm-config.service';
import { PROVIDERS } from '../../../shared/constants/llm_providers';
import { LLM_Provider } from '../../../shared/models/LLM_provider.model';
import {
  GetLlmModelRequest,
  LLM_Model,
} from '../../../shared/models/LLM.model';
import { EmbeddingModel } from '../../../shared/models/embedding.model';
import { forkJoin, Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { LLM_Models_Service } from '../../../services/LLM_models.service';
import { EmbeddingModelsService } from '../../../services/embeddings.service';
import { FullRealtimeConfig } from './realtime-models-services/full-reamtime-config.service';
import { RealtimeModel } from './realtime-models-services/real-time-models.service';

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

  // LLM setters
  setLLMConfigs(configs: FullLLMConfig[]): void {
    this.llmConfigs.set(configs);
  }

  setLLMModels(models: LLM_Model[]): void {
    this.llmModels.set(models);
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
}
