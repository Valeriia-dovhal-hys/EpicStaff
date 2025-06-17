import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditProjectDefaultsDialogComponent } from './edit-project-defaults-dialog/edit-project-defaults-dialog.component';
import { ProjectDefaults } from '../../services/mock/project-defaults.model';
import { EmbeddingConfig } from '../../shared/models/embedding-config.model';
import { ProjectDefaultsService } from '../../services/mock/project-defaults.service';
import { EmbeddingConfigsService } from '../../services/embedding_configs.service';
import { Subscription, forkJoin } from 'rxjs';
import { NgIf } from '@angular/common';
import { LLM_Config_Service } from '../../services/LLM_config.service';
import { LLM_Config } from '../../shared/models/LLM_config.model';
import { LLM_Models_Service } from '../../services/LLM_models.service';

@Component({
    selector: 'app-project-settings',
    templateUrl: './project-settings.component.html',
    styleUrls: ['./project-settings.component.scss'],
    imports: [NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSettingsComponent implements OnInit, OnDestroy {
  public projectDefaults!: ProjectDefaults;

  public llmConfigs: LLM_Config[] = [];
  public selectedLLMConfig?: LLM_Config;

  public embeddingConfigs: EmbeddingConfig[] = [];
  public selectedEmbeddingConfig?: EmbeddingConfig;

  public isHoveringLLMConfig = false;
  public isHoveringEmbeddingConfig = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public dialog: MatDialog,
    private projectDefaultsService: ProjectDefaultsService,
    private llmConfigService: LLM_Config_Service,
    private llmModelsService: LLM_Models_Service,
    private embeddingConfigsService: EmbeddingConfigsService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const dataSubscription = forkJoin({
      projectDefaults: this.projectDefaultsService.getProjectDefaults(),
      llmConfigs: this.llmConfigService.getAllConfigsLLM(),
      llmModels: this.llmModelsService.getLLMModels(),
      embeddingConfigs: this.embeddingConfigsService.getEmbeddingConfigs(),
    }).subscribe({
      next: ({ projectDefaults, llmConfigs, llmModels, embeddingConfigs }) => {
        this.projectDefaults = projectDefaults;
        this.llmConfigs = llmConfigs;
        this.embeddingConfigs = embeddingConfigs;

        this.selectedLLMConfig = this.llmConfigs.find(
          (config) => config.id === projectDefaults.manager_llm_config
        );

        if (projectDefaults.embedding_config !== null) {
          this.selectedEmbeddingConfig = this.embeddingConfigs.find(
            (config) => config.id === projectDefaults.embedding_config
          );

          if (!this.selectedEmbeddingConfig) {
            console.error(
              `Embedding Config with ID ${projectDefaults.embedding_config} not found.`
            );
          }
        }
        this.cdRef.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load data', error);
      },
    });

    this.subscriptions.add(dataSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openEditProjectDefaultsDialog(): void {
    const dialogRef = this.dialog.open(EditProjectDefaultsDialogComponent, {
      width: '700px',
      data: {
        projectDefaults: this.projectDefaults,
        selectedLLMConfig: this.selectedLLMConfig,
        selectedEmbeddingConfig: this.selectedEmbeddingConfig,
        llmConfigs: this.llmConfigs,
        embeddingConfigs: this.embeddingConfigs,
      },
      backdropClass: 'custom-dialog-backdrop',
    });

    const dialogSubscription = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.projectDefaults = result.projectDefaults;
        this.selectedLLMConfig = result.selectedLLMConfig;
        this.selectedEmbeddingConfig = result.selectedEmbeddingConfig;
        this.cdRef.markForCheck();

        console.log(this.projectDefaults);
        console.log(this.selectedLLMConfig);
      }
    });

    this.subscriptions.add(dialogSubscription);
  }

  onLLMConfigHover(isHovering: boolean) {
    this.isHoveringLLMConfig = isHovering;
  }

  onEmbeddingConfigHover(isHovering: boolean) {
    this.isHoveringEmbeddingConfig = isHovering;
  }
}
