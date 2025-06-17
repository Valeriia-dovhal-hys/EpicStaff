// mock-llm-config.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LLMConfig } from './llm_config.model';

@Injectable({
  providedIn: 'root',
})
export class MockLLMConfigService {
  private llmConfigs: LLMConfig[] = [
    {
      id: 1,
      custom_name: 'Config For gpt-35',
      temperature: 0.7,
      context: 5,
      activated: true,
      llm_model: 4,
    },
    {
      id: 2,
      custom_name: 'Config For gpt-4 Azure',
      temperature: 0.8,
      context: 15,
      activated: true,
      llm_model: 5,
    },
    {
      id: 3,
      custom_name: 'Config For Gpt-4o',
      temperature: 0.6,
      context: 25,
      activated: false,
      llm_model: 2,
    },
    {
      id: 4,
      custom_name: 'Config For gpt-3.5-Turbo',
      temperature: 0.5,
      context: 35,
      activated: true,
      llm_model: 1,
    },
    {
      id: 5,
      custom_name: 'Config For gpt-4-Turbo-preview',
      temperature: 0.9,
      context: 45,
      activated: false,
      llm_model: 3,
    },
  ];

  constructor() {}

  public getLLMConfigs(): Observable<LLMConfig[]> {
    return of(this.llmConfigs);
  }
}
