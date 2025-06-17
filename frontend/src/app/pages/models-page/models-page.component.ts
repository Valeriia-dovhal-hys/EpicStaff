import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../shared/components/header/page-header.component';
import { FullEmbeddingConfigService } from '../../services/full-embedding.service';
import { FullLLMConfigService } from '../../services/full-llm-config.service';
import { FullRealtimeConfigService } from './services/realtime-models-services/full-reamtime-config.service';
import { ModelsPageService } from './services/models-page.service';
import { ProviderListComponent } from './components/provider-list/provider-list.component';
import { EmbeddingModelsService } from '../../services/embeddings.service';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { ToastService } from '../../services/notifications/toast.service';
import { LLM_Providers_Service } from '../../services/LLM_providers.service';

@Component({
  selector: 'app-models-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ProviderListComponent],
  templateUrl: './models-page.component.html',
  styleUrls: ['./models-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsPageComponent implements OnInit {
  private modelsPageService = inject(ModelsPageService);
  private fullLLMConfigService = inject(FullLLMConfigService);
  private fullEmbeddingConfigService = inject(FullEmbeddingConfigService);
  private fullRealtimeConfigService = inject(FullRealtimeConfigService);
  private llmModelsService = inject(LLM_Models_Service);
  private embeddingModelsService = inject(EmbeddingModelsService);
  private providersService = inject(LLM_Providers_Service);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.fetchAllData();
  }

  fetchAllData(): void {
    // Set loading flag
    this.modelsPageService.loading.set(true);

    forkJoin({
      llmConfigs: this.fullLLMConfigService.getFullLLMConfigs(),
      embeddingConfigs:
        this.fullEmbeddingConfigService.getFullEmbeddingConfigs(),
      realtime: this.fullRealtimeConfigService.getFullRealtimeConfigs(),
      llmModels: this.llmModelsService.getLLMModels(),
      embeddingModels: this.embeddingModelsService.getEmbeddingModels(),
      providers: this.providersService.getProviders(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.modelsPageService.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          // Update signals in the service with the fetched data
          this.modelsPageService.setProviders(result.providers);
          this.modelsPageService.setLLMConfigs(result.llmConfigs);
          this.modelsPageService.setEmbeddingConfigs(result.embeddingConfigs);

          this.modelsPageService.setLLMModels(result.llmModels);
          this.modelsPageService.setEmbeddingModels(result.embeddingModels);

          this.modelsPageService.setRealtimeConfigs(
            result.realtime.fullConfigs
          );
          this.modelsPageService.setRealtimeModels(result.realtime.models);
          console.log('All providers, models and configs loaded successfully');
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.toastService.error('Failed to load data');
        },
      });
  }

  openCreateCustomModel() {
    this.toastService.info('create custom model will be implemented soon');
  }
}
