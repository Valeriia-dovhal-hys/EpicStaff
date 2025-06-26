import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullEmbeddingConfig } from '../../../../../../features/settings-dialog/services/embeddings/full-embedding.service';
import { FullLLMConfig } from '../../../../../../features/settings-dialog/services/llms/full-llm-config.service';
import { EmbeddingDropdownComponent } from '../embedding-dropdown/embedding-dropdown.component';
import { ModelDropdownComponent } from '../llm-configs-dropdown/llm-configs-dropdown.component';

@Component({
  selector: 'app-model-project-section',
  standalone: true,
  imports: [CommonModule, ModelDropdownComponent, EmbeddingDropdownComponent],
  template: `
    <div class="model-project-content">
      <div class="model-group">
        <div class="model-group-header">
          <span>Default Project Manager LLM </span>
        </div>
        <div class="model-selection-container">
          <app-model-dropdown
            [models]="llmConfigs"
            [selectedModelId]="selectedProjectLLMId"
            (modelSelected)="selectProjectLLM($event)"
          ></app-model-dropdown>
        </div>
      </div>

      <div class="model-group">
        <div class="model-group-header">
          <span>Default Project Embedding Model</span>
        </div>
        <div class="model-selection-container">
          <app-embedding-dropdown
            [models]="embeddingConfigs"
            [selectedModelId]="selectedProjectEmbeddingId"
            (modelSelected)="selectProjectEmbedding($event)"
          ></app-embedding-dropdown>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .model-project-content {
        .model-group {
          margin-bottom: 20px;

          .model-group-header {
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.8);
          }
        }
        .model-group:last-child {
          margin-bottom: 0px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelProjectSectionComponent implements OnInit {
  @Input() llmConfigs: FullLLMConfig[] = [];
  @Input() embeddingConfigs: FullEmbeddingConfig[] = [];

  public selectedProjectLLMId: number | null = null;
  public selectedProjectEmbeddingId: number | null = null;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    // Set default selections if configs are available
    if (this.llmConfigs.length > 0) {
      this.selectedProjectLLMId = this.llmConfigs[0].id;
    }

    if (this.embeddingConfigs.length > 0) {
      this.selectedProjectEmbeddingId = this.embeddingConfigs[0].id;
    }
  }

  public selectProjectLLM(id: number): void {
    this.selectedProjectLLMId = id;
    this.changeDetectorRef.markForCheck();
    // Here you would typically call a service to save this selection
  }

  public selectProjectEmbedding(id: number): void {
    this.selectedProjectEmbeddingId = id;
    this.changeDetectorRef.markForCheck();
    // Here you would typically call a service to save this selection
  }
}
