// src/app/components/staff-settings/staff-settings.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditAgentDefaultsDialogComponent } from './edit-agent-defaults-dialog.component.ts/edit-agent-defaults-dialog.component.ts.component';
import { AgentDefaults } from '../../services/mock/agent-defaults.model';
import { LLM_Config } from '../../shared/models/LLM_config.model';
import { LLM_Model } from '../../shared/models/LLM.model';
import { AgentDefaultsService } from '../../services/mock/agent-defaults.service';
import { LLM_Config_Service } from '../../services/LLM_config.service';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { Subscription, forkJoin } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-staff-settings',
    templateUrl: './staff-settings.component.html',
    styleUrls: ['./staff-settings.component.scss'],
    imports: [NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffSettingsComponent implements OnInit, OnDestroy {
  public agentDefaults!: AgentDefaults;
  public llmConfigs: LLM_Config[] = [];
  public llmModels: LLM_Model[] = [];
  public selectedLLMConfig?: LLM_Config;
  public selectedFunctionLLMConfig?: LLM_Config;

  public isHoveringLLMConfig = false;
  public isHoveringFunctionLLMConfig = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public dialog: MatDialog,
    private agentDefaultsService: AgentDefaultsService,
    private llmConfigService: LLM_Config_Service,
    private llmModelsService: LLM_Models_Service,
    private cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    const dataSubscription = forkJoin({
      agentDefaults: this.agentDefaultsService.getAgentDefaults(),
      llmConfigs: this.llmConfigService.getAllConfigsLLM(),
      llmModels: this.llmModelsService.getLLMModels(),
    }).subscribe({
      next: ({ agentDefaults, llmConfigs, llmModels }) => {
        this.agentDefaults = agentDefaults;
        this.llmConfigs = llmConfigs;
        this.llmModels = llmModels;

        // Find the LLM config matching the llm_config
        this.selectedLLMConfig = this.llmConfigs.find(
          (config) => config.id === this.agentDefaults.llm_config
        );

        // Find the Function LLM config matching the fcm_llm_config
        this.selectedFunctionLLMConfig = this.llmConfigs.find(
          (config) => config.id === this.agentDefaults.fcm_llm_config
        );

        // Update the agentDefaults with the LLM Config names
        this.agentDefaults.llmConfigName = this.selectedLLMConfig?.custom_name;
        this.agentDefaults.fcmLlmConfigName =
          this.selectedFunctionLLMConfig?.custom_name;

        if (!this.selectedLLMConfig && this.agentDefaults.llm_config !== null) {
          console.error(
            `LLM Config with ID ${this.agentDefaults.llm_config} not found.`
          );
        }

        if (
          !this.selectedFunctionLLMConfig &&
          this.agentDefaults.fcm_llm_config !== null
        ) {
          console.error(
            `Function LLM Config with ID ${this.agentDefaults.fcm_llm_config} not found.`
          );
        }

        this.cdRef.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load data', error);
      },
    });

    this.subscriptions.add(dataSubscription);
  }

  public openEditAgentDefaultsDialog(): void {
    const dialogRef = this.dialog.open(EditAgentDefaultsDialogComponent, {
      width: '700px',
      data: {
        agentDefaults: this.agentDefaults,
        llmConfig: this.selectedLLMConfig,
        functionLLMConfig: this.selectedFunctionLLMConfig,
        llmConfigs: this.llmConfigs,
      },
      backdropClass: 'custom-dialog-backdrop',
    });

    const dialogSubscription = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agentDefaults = result.agentDefaults;
        this.selectedLLMConfig = result.llmConfig;
        this.selectedFunctionLLMConfig = result.functionLLMConfig;

        // Update the agentDefaults with the possibly updated LLM Config names
        this.agentDefaults.llmConfigName = this.selectedLLMConfig?.custom_name;
        this.agentDefaults.fcmLlmConfigName =
          this.selectedFunctionLLMConfig?.custom_name;

        console.log('Agent Defaults updated:', result);

        this.cdRef.markForCheck();
      }
    });

    this.subscriptions.add(dialogSubscription);
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onLLMConfigHover(isHovering: boolean): void {
    this.isHoveringLLMConfig = isHovering;
  }

  onFunctionLLMConfigHover(isHovering: boolean): void {
    this.isHoveringFunctionLLMConfig = isHovering;
  }
}
