import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullEmbeddingConfig } from '../../../../../../services/full-embedding.service';
import { FullLLMConfig } from '../../../../../../services/full-llm-config.service';
import { ModelDropdownComponent } from '../llm-configs-dropdown/llm-configs-dropdown.component';

@Component({
  selector: 'app-model-agent-section',
  standalone: true,
  imports: [CommonModule, ModelDropdownComponent],
  template: `
    <div class="model-agent-content">
      <div class="model-group" *ngIf="llmConfigs.length > 0">
        <div class="model-group-header">
          <span>Default Agent LLM</span>
        </div>
        <div class="model-selection">
          <app-model-dropdown
            [models]="llmConfigs"
            [selectedModelId]="selectedLLMId"
            (modelSelected)="selectLLM($event)"
          ></app-model-dropdown>
        </div>
      </div>

      <div class="model-group" *ngIf="llmConfigs.length > 0">
        <div class="model-group-header">
          <span>Default Agent Function LLM</span>
        </div>
        <div class="model-selection">
          <app-model-dropdown
            [models]="llmConfigs"
            [selectedModelId]="selectedFunctionLLMId"
            (modelSelected)="selectFunctionLLM($event)"
          ></app-model-dropdown>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .model-agent-content {
        .model-group {
          margin-bottom: 20px;

          .model-group-header {
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.8);
          }
        }

        /* Remove bottom margin for the last model group */
        .model-group:last-child {
          margin-bottom: 0px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelAgentSectionComponent implements OnInit {
  @Input() llmConfigs: FullLLMConfig[] = [];

  public selectedLLMId: number | null = null;
  public selectedFunctionLLMId: number | null = null;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    // Set default selections if configs are available
    if (this.llmConfigs.length > 0) {
      this.selectedLLMId = this.llmConfigs[0].id;
      this.selectedFunctionLLMId = this.llmConfigs[0].id;
    }
  }

  public selectLLM(id: number): void {
    this.selectedLLMId = id;
    this.changeDetectorRef.markForCheck();
    // Here you would typically call a service to save this selection
  }

  public selectFunctionLLM(id: number): void {
    this.selectedFunctionLLMId = id;
    this.changeDetectorRef.markForCheck();
    // Here you would typically call a service to save this selection
  }
}
