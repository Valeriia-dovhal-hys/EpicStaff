import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GetProjectRequest } from '../../features/projects/models/project.model';
import { LLM_Config_Service } from '../../features/settings-dialog/services/llms/LLM_config.service';
import { EmbeddingConfigsService } from '../../features/settings-dialog/services/embeddings/embedding_configs.service';
import { GetLlmConfigRequest } from '../../features/settings-dialog/models/llms/LLM_config.model';
import { GetEmbeddingConfigRequest } from '../../features/settings-dialog/models/embeddings/embedding-config.model';
import { ProjectsApiService } from '../../features/projects/services/projects-api.service';
import { HelpTooltipComponent } from '../../shared/components/help-tooltip/help-tooltip.component';
import { ToastService } from '../../services/notifications/toast.service';
import { LlmModelSelectorComponent } from '../../shared/components/llm-model-selector/llm-model-selector.component';
import { EmbeddingModelSelectorComponent } from '../../shared/components/embedding-model-selector/embedding-model-selector.component';
import { FullLLMConfigService } from '../../features/settings-dialog/services/llms/full-llm-config.service';
import { FullEmbeddingConfigService } from '../../features/settings-dialog/services/embeddings/full-embedding.service';

@Component({
  selector: 'app-settings-section',
  templateUrl: './settings-section.component.html',
  styleUrls: ['./settings-section.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HelpTooltipComponent,
    LlmModelSelectorComponent,
    EmbeddingModelSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSectionComponent implements OnInit, OnChanges {
  @Input() public project!: GetProjectRequest;

  // Project settings as signals
  public memory = signal<boolean>(false);
  public max_rpm = signal<number>(15);
  public process = signal<'sequential' | 'hierarchical'>('sequential');
  public manager_llm_config = signal<number | null>(null);
  public embedding_config = signal<number | null>(null);
  public settings = signal<{
    temperature: number;
    cache: boolean;
    full_output: boolean;
    planning: boolean;
  }>({
    temperature: 0.7,
    cache: false,
    full_output: false,
    planning: false,
  });

  // Other signals for reactive data
  public availableLLMs = signal<GetLlmConfigRequest[]>([]);
  public embeddingConfigs = signal<GetEmbeddingConfigRequest[]>([]);

  // Full config objects for the selectors
  public fullLLMConfigs = signal<any[]>([]);
  public fullEmbeddingConfigs = signal<any[]>([]);

  public isLoading = signal(true);
  public configsLoaded = signal(false);

  constructor(
    private llmConfigService: LLM_Config_Service,
    private embeddingConfigService: EmbeddingConfigsService,
    private fullLLMConfigService: FullLLMConfigService,
    private fullEmbeddingConfigService: FullEmbeddingConfigService,
    private projectsApiService: ProjectsApiService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  public ngOnInit(): void {
    this.loadConfigurations();
    this.initializeBasicSettings();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && !changes['project'].firstChange) {
      this.initializeBasicSettings();
      if (this.configsLoaded()) {
        this.initializeHierarchicalSettings();
      }
    }
  }

  private initializeBasicSettings(): void {
    if (this.project) {
      this.memory.set(this.project.memory ?? false);
      this.max_rpm.set(this.project.max_rpm ?? 15);
      this.process.set(this.project.process ?? 'sequential');

      this.settings.set({
        temperature: this.project.default_temperature ?? 0.7,
        cache: this.project.cache ?? false,
        full_output: this.project.full_output ?? false,
        planning: this.project.planning ?? false,
      });

      this.cdr.markForCheck();
    }
  }

  private initializeHierarchicalSettings(): void {
    if (this.project) {
      this.manager_llm_config.set(this.project.manager_llm_config);
      this.embedding_config.set(this.project.embedding_config);

      this.cdr.markForCheck();
    }
  }

  private loadConfigurations(): void {
    this.isLoading.set(true);
    this.configsLoaded.set(false);

    // Fetch LLM configs
    this.llmConfigService.getAllConfigsLLM().subscribe({
      next: (configs) => {
        this.availableLLMs.set(configs);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error fetching LLM configs:', error);
        this.checkLoadingComplete();
      },
    });

    // Fetch embedding configs
    this.embeddingConfigService.getEmbeddingConfigs().subscribe({
      next: (configs) => {
        this.embeddingConfigs.set(configs);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error fetching embedding configs:', error);
        this.checkLoadingComplete();
      },
    });

    // Fetch full LLM configs for the selector
    this.fullLLMConfigService.getFullLLMConfigs().subscribe({
      next: (configs) => {
        this.fullLLMConfigs.set(configs);
      },
      error: (error) => {
        console.error('Error fetching full LLM configs:', error);
      },
    });

    // Fetch full embedding configs for the selector
    this.fullEmbeddingConfigService.getFullEmbeddingConfigs().subscribe({
      next: (configs) => {
        this.fullEmbeddingConfigs.set(configs);
      },
      error: (error) => {
        console.error('Error fetching full embedding configs:', error);
      },
    });
  }

  private checkLoadingComplete(): void {
    if (this.availableLLMs().length > 0 && this.embeddingConfigs().length > 0) {
      this.isLoading.set(false);
      this.configsLoaded.set(true);
      this.initializeHierarchicalSettings();
      this.cdr.markForCheck();
    }
  }

  // Event handlers
  public toggleMemory(): void {
    const newValue = !this.memory();
    this.memory.set(newValue);
    this.onSettingChange('memory', newValue);
  }

  public toggleProcess(): void {
    const newValue =
      this.process() === 'sequential' ? 'hierarchical' : 'sequential';
    this.process.set(newValue);
    this.onSettingChange('process', newValue);
  }

  public toggleSetting(setting: 'cache' | 'full_output' | 'planning'): void {
    const currentSettings = this.settings();
    const newValue = !currentSettings[setting];

    this.settings.set({
      ...currentSettings,
      [setting]: newValue,
    });

    this.onSettingChange(setting, newValue);
  }

  public onRpmChange(): void {
    this.onSettingChange('max_rpm', this.max_rpm());
  }

  public onLLMConfigChange(): void {
    this.onSettingChange('manager_llm_config', this.manager_llm_config());
  }

  public onEmbeddingConfigChange(): void {
    this.onSettingChange('embedding_config', this.embedding_config());
  }

  public onSettingChange(setting: string, value: any): void {
    if (!this.project || !this.project.id) return;

    const updateData: Partial<GetProjectRequest> = {
      [setting]: value,
    };

    const settingDisplayName = this.getSettingDisplayName(setting);

    this.projectsApiService
      .patchUpdateProject(this.project.id, updateData)
      .subscribe({
        next: (updatedProject) => {
          console.log(
            `Setting ${setting} updated successfully`,
            updatedProject
          );
          this.toastService.success(
            `${settingDisplayName} updated successfully`
          );
        },
        error: (error) => {
          console.error(`Error updating setting ${setting}:`, error);
          this.toastService.error(`Failed to update ${settingDisplayName}`);

          // Revert the change on error
          this.initializeBasicSettings();
          if (this.configsLoaded()) {
            this.initializeHierarchicalSettings();
          }
        },
      });
  }

  private getSettingDisplayName(setting: string): string {
    // Map internal setting names to user-friendly names
    const settingMap: { [key: string]: string } = {
      memory: 'Memory',
      process: 'Process type',
      max_rpm: 'Max RPM',
      manager_llm_config: 'LLM configuration',
      embedding_config: 'Embedding configuration',
      cache: 'Cache setting',
      full_output: 'Full output setting',
      planning: 'Planning setting',
      default_temperature: 'Temperature',
    };

    return settingMap[setting] || setting;
  }

  public get temperaturePercent(): number {
    return Math.round(this.settings().temperature * 100);
  }

  public set temperaturePercent(val: number) {
    const currentSettings = this.settings();
    const newTemperature = parseFloat((val / 100).toFixed(1));

    this.settings.set({
      ...currentSettings,
      temperature: newTemperature,
    });

    this.onSettingChange('default_temperature', newTemperature);
  }
}
