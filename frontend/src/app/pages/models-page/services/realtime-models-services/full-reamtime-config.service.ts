import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  RealtimeModel,
  RealtimeModelsService,
} from './real-time-models.service';
import {
  RealtimeModelConfig,
  RealtimeModelConfigsService,
} from './real-time-model-config.service';

export interface FullRealtimeConfig extends RealtimeModelConfig {
  modelDetails: RealtimeModel | null;
}

@Injectable({
  providedIn: 'root',
})
export class FullRealtimeConfigService {
  constructor(
    private realtimeModelConfigsService: RealtimeModelConfigsService,
    private realtimeModelsService: RealtimeModelsService
  ) {}

  getFullRealtimeConfigs(): Observable<{
    fullConfigs: FullRealtimeConfig[];
    models: RealtimeModel[];
  }> {
    return forkJoin({
      configs: this.realtimeModelConfigsService.getAllConfigs(),
      models: this.realtimeModelsService.getAllModels(),
    }).pipe(
      map(({ configs, models }) => {
        // Build a lookup map of model ID -> model
        const modelMap: Record<number, RealtimeModel> = {};
        models.forEach((model) => {
          modelMap[model.id] = model;
        });

        // Merge each config with its corresponding model details
        const fullConfigs: FullRealtimeConfig[] = configs.map((config) => {
          const modelDetails = modelMap[config.realtime_model] || null;
          return {
            ...config,
            modelDetails,
          };
        });

        // Return both the enriched configs and the full list of models
        return { fullConfigs, models };
      })
    );
  }
}
