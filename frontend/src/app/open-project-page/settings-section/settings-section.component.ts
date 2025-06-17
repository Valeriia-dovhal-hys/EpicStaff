import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { GetProjectRequest } from '../../pages/projects-page/models/project.model';
import { LLM_Config_Service } from '../../services/LLM_config.service';
import { EmbeddingConfigsService } from '../../services/embedding_configs.service';
import { GetLlmConfigRequest } from '../../shared/models/LLM_config.model';
import { GetEmbeddingConfigRequest } from '../../shared/models/embedding-config.model';

export class Settings {
  memory: boolean;
  temperature: number;
  config: any; // Adjust according to your configuration type
  max_rpm: number;
  cache: boolean;
  full_output: boolean;
  planning: boolean;
  planning_llm_config: number | null;
  manager_llm_config: number;
  embedding_config: number;

  constructor(project: Partial<GetProjectRequest> = {}) {
    // Fixed 'max_rmp' to 'max_rpm' to match interface property name
    this.memory = project.memory ?? true;
    this.temperature = project.default_temperature ?? 0.7;
    this.config = project.config ?? null;
    this.max_rpm = project.max_rmp ?? 10; // Fixed property name
    this.cache = project.cache ?? true;
    this.full_output = project.full_output ?? false;
    this.planning = project.planning ?? true;
    this.planning_llm_config = project.planning_llm_config ?? null;
    this.manager_llm_config = project.manager_llm_config ?? 2;
    this.embedding_config = project.embedding_config ?? 1;
  }
}

@Component({
  selector: 'app-settings-section',
  templateUrl: './settings-section.component.html',
  styleUrls: ['./settings-section.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // Added for better performance
})
export class SettingsSectionComponent implements OnInit {
  @Input() public project!: GetProjectRequest;
  @Output() settingsChanged = new EventEmitter<Partial<GetProjectRequest>>();

  settings: Settings;
  availableLLMs: GetLlmConfigRequest[] = [];
  embeddingConfigs: GetEmbeddingConfigRequest[] = [];

  constructor(
    private llmConfigService: LLM_Config_Service,
    private embeddingConfigService: EmbeddingConfigsService
  ) {
    this.settings = new Settings(); // Initialize the settings object
  }

  ngOnInit(): void {
    // Initialize settings based on project values
    if (this.project) {
      this.settings = new Settings(this.project); // Pass project data to the Settings model
    }

    // Fetch LLM configs
    this.llmConfigService.getAllConfigsLLM().subscribe({
      next: (configs) => {
        this.availableLLMs = configs;
      },
      error: (error) => {
        console.error('Error fetching LLM configs:', error);
      },
    });

    // Fetch embedding configs
    this.embeddingConfigService.getEmbeddingConfigs().subscribe({
      next: (configs) => {
        this.embeddingConfigs = configs;
      },
      error: (error) => {
        console.error('Error fetching embedding configs:', error);
      },
    });
  }

  onSettingChange<T extends keyof Settings>(
    settingKey: T,
    newValue: (typeof this.settings)[T]
  ) {
    this.settings[settingKey] = newValue; // Immediately reflect changes in the settings object

    // Map the internal setting key to the corresponding project property key
    // Most keys match directly, but some need transformation
    let projectKey: string = settingKey;

    if (settingKey === 'temperature') {
      projectKey = 'default_temperature';
    }

    // Emit the changed setting
    this.settingsChanged.emit({ [projectKey]: newValue });
  }

  // Custom getter/setter for temperature as percentage
  get temperaturePercent(): number {
    return Math.round(this.settings.temperature * 100);
  }

  set temperaturePercent(val: number) {
    this.settings.temperature = parseFloat((val / 100).toFixed(1));
    this.onSettingChange('temperature', this.settings.temperature);
  }

  // Toggle handlers
  toggleSetting(settingKey: keyof Settings) {
    const currentValue = this.settings[settingKey];
    if (typeof currentValue === 'boolean') {
      this.onSettingChange(settingKey, !currentValue);
    }
  }

  // Specific setting change handlers
  onLLMConfigChange() {
    this.onSettingChange(
      'manager_llm_config',
      this.settings.manager_llm_config
    );
  }

  onEmbeddingConfigChange() {
    this.onSettingChange('embedding_config', this.settings.embedding_config);
  }

  onRpmChange() {
    this.onSettingChange('max_rpm', this.settings.max_rpm);
  }
}
