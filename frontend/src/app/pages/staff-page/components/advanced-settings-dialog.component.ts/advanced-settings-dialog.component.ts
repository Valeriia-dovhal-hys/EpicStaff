import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { FullLlmConfig } from '../../../../services/full-agent.service';
import { GetSourceCollectionRequest } from '../../../knowledge-sources/models/source-collection.model';

import { forkJoin, Subject, takeUntil } from 'rxjs';
import { LLM_Config_Service } from '../../../../services/LLM_config.service';
import { LLM_Models_Service } from '../../../../services/LLM_models.service';
import { CollectionsService } from '../../../knowledge-sources/services/source-collections.service';
import { KnowledgeSelectorComponent } from './knowledge-selector/knowledge-selector.component';
import { LlmSelectorComponent } from './fcm-llm-selector/llm-selector.component';
import { FormSliderComponent } from '../../../../shared/components/forms/slider/form-slider.component';

export interface AdvancedSettingsData {
  fullFcmLlmConfig?: FullLlmConfig;
  agentRole: string;
  max_iter: number;
  max_rpm: number | null;
  max_execution_time: number | null;
  cache: boolean | null;
  allow_code_execution: boolean | null;
  max_retry_limit: number | null;
  respect_context_window: boolean | null;
  default_temperature: number | null;
  knowledge_collection?: number | null;
  selected_knowledge_source?: GetSourceCollectionRequest | null; // For display purposes only
}

@Component({
  selector: 'app-advanced-settings-dialog',
  imports: [
    FormsModule,
    KnowledgeSelectorComponent,
    LlmSelectorComponent,
    FormSliderComponent,
  ],
  standalone: true,
  templateUrl: './advanced-settings-dialog.component.html',
  styleUrls: ['./advanced-settings-dialog.component.scss'],
})
export class AdvancedSettingsDialogComponent implements OnInit {
  agentData: AdvancedSettingsData;
  combinedLLMs: any[] = [];
  selectedLlmId: number | null = null;
  isLoadingLLMs = false;

  // Temperature slider value (0-100 for display, converted to 0-1 for storage)
  public temperatureValue: number = 0;

  // Knowledge sources
  allKnowledgeSources: GetSourceCollectionRequest[] = [];
  isLoadingKnowledgeSources = false;
  knowledgeSourcesError: string | null = null;

  private readonly _destroyed$ = new Subject<void>();

  constructor(
    public dialogRef: DialogRef<AdvancedSettingsData>,
    @Inject(DIALOG_DATA) public data: AdvancedSettingsData,
    private llmConfigService: LLM_Config_Service,
    private llmModelsService: LLM_Models_Service,
    private collectionsService: CollectionsService
  ) {
    // Initialize your local data from the injected data
    this.agentData = { ...data };
    console.log(
      'Constructor - Initial agentData:',
      JSON.stringify(this.agentData)
    );

    // Initialize temperature slider value from default_temperature (convert from 0-1 to 0-100)
    this.temperatureValue = Math.round(
      (this.agentData.default_temperature ?? 0) * 100
    );

    // Initialize selected LLM ID from fullFcmLlmConfig if present
    if (this.agentData.fullFcmLlmConfig) {
      this.selectedLlmId = this.agentData.fullFcmLlmConfig.id;
    } else {
      this.selectedLlmId = null; // "Same as LLM" option
    }

    // Log the value of knowledge_collection specifically
    console.log(
      'Constructor - knowledge_collection value:',
      this.agentData.knowledge_collection
    );
  }

  // Handle slider input changes
  public onSliderInput(newValue: number): void {
    this.temperatureValue = newValue;
    // Convert from 0-100 to 0-1 scale
    this.agentData.default_temperature = newValue / 100;
  }

  // In ngOnInit
  ngOnInit(): void {
    console.log('ngOnInit - Starting initialization');
    // Fetch LLM configs, models, and knowledge sources
    this.isLoadingKnowledgeSources = true;
    this.isLoadingLLMs = true;

    forkJoin({
      configs: this.llmConfigService.getAllConfigsLLM(),
      models: this.llmModelsService.getLLMModels(),
      knowledgeSources:
        this.collectionsService.getGetSourceCollectionRequests(),
    })
      .pipe(takeUntil(this._destroyed$))
      .subscribe({
        next: ({ configs, models, knowledgeSources }) => {
          console.log('API response - Knowledge sources:', knowledgeSources);

          // Process LLM configs and models
          this.combinedLLMs = configs.map((config) => ({
            ...config,
            modelName:
              models.find((model) => model.id === config.model)?.name ||
              'Unknown',
          }));

          // Sort alphabetically by model name
          this.combinedLLMs.sort(
            (a, b) =>
              a.modelName.localeCompare(b.modelName) ||
              a.custom_name.localeCompare(b.custom_name)
          );

          // Process knowledge sources
          this.allKnowledgeSources = knowledgeSources;
          console.log(
            'Loaded knowledge sources count:',
            this.allKnowledgeSources.length
          );

          // Set selected knowledge source based on the ID
          if (this.agentData.knowledge_collection) {
            console.log(
              'Attempting to find knowledge source with ID:',
              this.agentData.knowledge_collection
            );

            const foundSource = this.allKnowledgeSources.find(
              (source) =>
                source.collection_id === this.agentData.knowledge_collection
            );

            console.log('Found source:', foundSource);

            this.agentData.selected_knowledge_source = foundSource || null;

            console.log(
              'Selected knowledge source after initialization:',
              this.agentData.selected_knowledge_source
                ? `${this.agentData.selected_knowledge_source.collection_name} (ID: ${this.agentData.selected_knowledge_source.collection_id})`
                : 'None'
            );
          } else {
            console.log('No knowledge_collection ID provided in initial data');
          }

          this.isLoadingKnowledgeSources = false;
          this.isLoadingLLMs = false;
        },
        error: (err) => {
          console.error('Error fetching data:', err);
          this.knowledgeSourcesError = 'Failed to load knowledge sources';
          this.isLoadingKnowledgeSources = false;
          this.isLoadingLLMs = false;
        },
      });
  }

  onLlmChange(llmId: number | null): void {
    console.log('LLM changed to:', llmId);
    this.selectedLlmId = llmId;

    if (llmId === null) {
      // "Default to LLM" option selected
      this.agentData.fullFcmLlmConfig = undefined;
    } else {
      // Find the selected LLM config
      const selectedLlm = this.combinedLLMs.find((llm) => llm.id === llmId);
      if (selectedLlm) {
        this.agentData.fullFcmLlmConfig = selectedLlm;
        console.log('Selected LLM config:', this.agentData.fullFcmLlmConfig);
      }
    }
  }

  onKnowledgeSourceChange(collectionId: number | null): void {
    console.log('Knowledge source changed to:', collectionId);
    this.agentData.knowledge_collection = collectionId;

    if (collectionId === null) {
      this.agentData.selected_knowledge_source = null;
    } else {
      const selectedCollection = this.allKnowledgeSources.find(
        (source) => source.collection_id === collectionId
      );
      this.agentData.selected_knowledge_source = selectedCollection || null;
    }
  }

  get temperaturePercent(): number {
    // If default_temperature is not defined, default to 0%
    return Math.round((this.agentData.default_temperature ?? 0) * 100);
  }

  set temperaturePercent(val: number) {
    // Convert the value to a scale of 0 to 1, rounded to one decimal place
    this.agentData.default_temperature = parseFloat((val / 100).toFixed(1));
  }

  // In save method
  save() {
    console.log(
      'save called - Final agentData:',
      JSON.stringify(this.agentData)
    );
    console.log(
      'knowledge_collection value before dialog close:',
      this.agentData.knowledge_collection
    );

    // Create a deep copy to prevent any unintended references
    const result = JSON.parse(JSON.stringify(this.agentData));

    console.log('Final data being returned:', JSON.stringify(result));
    this.dialogRef.close(result);
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }
}
