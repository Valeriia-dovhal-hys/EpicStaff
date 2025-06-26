import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  FullEmbeddingConfig,
  FullEmbeddingConfigService,
} from '../../../../features/settings-dialog/services/embeddings/full-embedding.service';
import {
  FullLLMConfig,
  FullLLMConfigService,
} from '../../../../features/settings-dialog/services/llms/full-llm-config.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ExpandableSectionComponent } from './components/expandable-section.component';
import { ModelAgentSectionComponent } from './components/models-section/model-agent-section.component';
import { FieldAgentSectionComponent } from './components/fields-section/field-agent-section.component';
import { ModelProjectSectionComponent } from './components/models-section/model-project-section.component';
import { ModelToolsSectionComponent } from './components/models-section/model-tools-section.component';
import { FieldProjectSectionComponent } from './components/fields-section/field-project-section.component';

@Component({
  selector: 'app-defaults-tab',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerComponent,
    ExpandableSectionComponent,
    ModelAgentSectionComponent,
    FieldAgentSectionComponent,
    ModelProjectSectionComponent,
    ModelToolsSectionComponent,
    FieldProjectSectionComponent,
  ],
  template: `
    <div class="tab-container">
      <div *ngIf="isLoading">
        <app-spinner
          [isOverlay]="false"
          [text]="'Loading defaults...'"
          [size]="30"
        >
        </app-spinner>
      </div>

      <ng-container *ngIf="!isLoading">
        <div class="switcher-group">
          <button
            class="switcher-button"
            [class.active]="activeTab() === 'models'"
            (click)="setActiveTab('models')"
          >
            Models
          </button>
          <button
            class="switcher-button"
            [class.active]="activeTab() === 'fields'"
            (click)="setActiveTab('fields')"
          >
            Fields
          </button>
        </div>

        <div class="content-section" *ngIf="activeTab() === 'models'">
          <app-expandable-section
            [title]="'Agents'"
            [expanded]="modelSections[0].expanded"
            (expandedChange)="updateSectionExpanded('models', 0, $event)"
          >
            <app-model-agent-section
              [llmConfigs]="llmConfigs"
            ></app-model-agent-section>
          </app-expandable-section>

          <app-expandable-section
            [title]="'Projects'"
            [expanded]="modelSections[1].expanded"
            (expandedChange)="updateSectionExpanded('models', 1, $event)"
          >
            <app-model-project-section
              [llmConfigs]="llmConfigs"
              [embeddingConfigs]="embeddingConfigs"
            ></app-model-project-section>
          </app-expandable-section>

          <app-expandable-section
            [title]="'Tools'"
            [expanded]="modelSections[2].expanded"
            (expandedChange)="updateSectionExpanded('models', 2, $event)"
          >
            <app-model-tools-section
              [llmConfigs]="llmConfigs"
              [embeddingConfigs]="embeddingConfigs"
            ></app-model-tools-section>
          </app-expandable-section>
        </div>

        <div class="content-section" *ngIf="activeTab() === 'fields'">
          <app-expandable-section
            [title]="'Agents'"
            [expanded]="fieldSections[0].expanded"
            (expandedChange)="updateSectionExpanded('fields', 0, $event)"
          >
            <app-field-agent-section></app-field-agent-section>
          </app-expandable-section>

          <app-expandable-section
            [title]="'Projects'"
            [expanded]="fieldSections[1].expanded"
            (expandedChange)="updateSectionExpanded('fields', 1, $event)"
          >
            <app-field-project-section></app-field-project-section>
          </app-expandable-section>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .tab-container {
        padding: 16px 24px 24px 24px;
        overflow-y: auto;
        max-height: 550px;
        p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          margin-bottom: 14px;
        }

        .switcher-group {
          display: flex;
          background-color: var(--gray-850);
          border-radius: 24px;
          padding: 4px;
          width: fit-content;
          margin-bottom: 16px;

          .switcher-button {
            background-color: transparent;
            color: var(--gray-300);
            border: none;
            border-radius: 20px;
            padding: 6px 16px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;

            &:hover {
              color: var(--white);
            }

            &.active {
              background-color: var(--accent-color);
              color: var(--white);
            }
          }
        }

        // .content-section {
        // }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultsTabComponent implements OnInit {
  public activeTab = signal<'models' | 'fields'>('models');
  public isLoading: boolean = true;
  public llmConfigs: FullLLMConfig[] = [];
  public embeddingConfigs: FullEmbeddingConfig[] = [];

  public modelSections = [
    { title: 'Agents', expanded: true },
    { title: 'Projects', expanded: false },
    { title: 'Tools', expanded: false },
  ];

  public fieldSections = [
    { title: 'Agents', expanded: true },
    { title: 'Projects', expanded: false },
    { title: 'Tools', expanded: false },
  ];

  constructor(
    private fullLLMConfigService: FullLLMConfigService,
    private fullEmbeddingConfigService: FullEmbeddingConfigService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.fetchModels();
  }

  public setActiveTab(tab: 'models' | 'fields'): void {
    this.activeTab.set(tab);
  }

  public updateSectionExpanded(
    tab: 'models' | 'fields',
    index: number,
    expanded: boolean
  ): void {
    if (tab === 'models') {
      this.modelSections[index].expanded = expanded;
    } else {
      this.fieldSections[index].expanded = expanded;
    }
  }

  private fetchModels(): void {
    this.isLoading = true;

    // Use timer to ensure spinner is displayed for at least 300ms
    timer(300)
      .pipe(
        switchMap(() =>
          forkJoin({
            llmConfigs: this.fullLLMConfigService.getFullLLMConfigs(),
            embeddingConfigs:
              this.fullEmbeddingConfigService.getFullEmbeddingConfigs(),
          })
        )
      )
      .subscribe({
        next: (result) => {
          this.llmConfigs = result.llmConfigs;
          this.embeddingConfigs = result.embeddingConfigs;
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching models:', error);
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }
}
