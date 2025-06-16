import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Agent } from '../../../shared/models/agent.model';
import { ToolsService } from '../../../services/tools.service';
import { LLM_Config_Service } from '../../../services/LLM_config.service';
import { Tool } from '../../../shared/models/tool.model';
import { LLM_Config } from '../../../shared/models/LLM_config.model';
import { LLM_Models_Service } from '../../../services/LLM_models.service';
import { LLM_Model } from '../../../shared/models/LLM.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agent-item',
  templateUrl: './agent-item.component.html',
  styleUrls: ['./agent-item.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentItemComponent implements OnInit {
  @Input() agent!: Agent;

  public tools: Tool[] = [];
  public llmConfig: LLM_Config | null = null;
  public llmModelName: string | null = null;
  public fcmLlmModelName: string | null = null;

  public configsLoaded = false;
  public modelsLoaded = false;

  public isExpanded: boolean = false;

  constructor(
    private toolsService: ToolsService,
    private llmConfigService: LLM_Config_Service,
    private llmModelsService: LLM_Models_Service,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchTools();
    this.fetchConfigs();
    this.fetchModelNames();
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  private fetchTools(): void {
    if (this.agent.tools && this.agent.tools.length > 0) {
      this.toolsService.getToolsByIds(this.agent.tools).subscribe({
        next: (tools: Tool[]) => {
          this.tools = tools;
          console.log(this.tools);
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error fetching tools:', error);
        },
      });
    }
  }

  private fetchConfigs(): void {
    if (this.agent.llm_config) {
      this.llmConfigService.getConfigById(this.agent.llm_config).subscribe({
        next: (config: LLM_Config) => {
          this.llmConfig = config;
          this.configsLoaded = true;
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error fetching LLM config:', error);
        },
      });
    } else {
      this.configsLoaded = true;
    }
  }

  private fetchModelNames(): void {
    const llmModel$ = this.agent.llm_model
      ? this.llmModelsService.getLLMModelById(this.agent.llm_model)
      : of(null);

    const fcmLlmModel$ = this.agent.fcm_llm_model
      ? this.llmModelsService.getLLMModelById(this.agent.fcm_llm_model)
      : of(null);

    forkJoin([llmModel$, fcmLlmModel$]).subscribe({
      next: ([llmModel, fcmLlmModel]) => {
        this.llmModelName = llmModel ? llmModel.name : null;
        this.fcmLlmModelName = fcmLlmModel ? fcmLlmModel.name : null;
        this.modelsLoaded = true;
        this.cdr.markForCheck(); // Trigger change detection
      },
      error: (error) => {
        console.error('Error fetching LLM models:', error);
      },
    });
  }

  navigateToStaff(): void {
    this.router.navigate(['/staff']);
  }
}
