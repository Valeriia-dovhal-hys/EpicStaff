import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { Tool } from '../../../shared/models/tool.model';
import {
  ToolConfig,
  CreateToolConfigRequest,
  GetToolConfigRequest,
} from '../../../shared/models/tool_config,model';
import { ToolConfigService } from '../../../services/tool_config.service';
import { GetLlmConfigRequest } from '../../../shared/models/LLM_config.model';
import {
  EmbeddingConfig,
  GetEmbeddingConfigRequest,
} from '../../../shared/models/embedding-config.model';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { ToolConfigFormComponent } from './tool-config-form/tool-config-form.component';
import { ConfirmationDialogService } from '../../../shared/components/cofirm-dialog/confimation-dialog.service';
import { LLM_Config_Service } from '../../../services/LLM_config.service';
import { EmbeddingConfigsService } from '../../../services/embedding_configs.service';
import { forkJoin, Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tool-configuration-dialog',
  templateUrl: './tool-configuration-dialog.component.html',
  styleUrls: ['./tool-configuration-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ToolConfigFormComponent],
})
export class ToolConfigurationDialogComponent implements OnInit, OnDestroy {
  tool: Tool;

  llmConfigs: GetLlmConfigRequest[] = [];
  embeddingConfigs: GetEmbeddingConfigRequest[] = [];
  existingToolConfigs: ToolConfig[] = [];

  selectedConfig: ToolConfig | null = null;
  currentFilteredConfigs: ToolConfig[] = [];

  // Fields previously in tool-config-list.component
  filteredConfigs: ToolConfig[] = [];
  searchHasContent = false;
  private currentSearchQuery = '';

  private subscriptions = new Subscription();
  private _destroy$ = new Subject<void>();

  constructor(
    public dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) public data: { tool: Tool },
    private toolConfigService: ToolConfigService,
    private llmConfigService: LLM_Config_Service,
    private embeddingConfigService: EmbeddingConfigsService,
    private _confirmationDialogService: ConfirmationDialogService,

    private cdr: ChangeDetectorRef
  ) {
    this.tool = data.tool;
  }

  ngOnInit(): void {
    this.fetchData();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  private fetchData(): void {
    const llmConfigs$: Observable<GetLlmConfigRequest[]> =
      this.llmConfigService.getAllConfigsLLM();
    const embeddingConfigs$: Observable<EmbeddingConfig[]> =
      this.embeddingConfigService.getEmbeddingConfigs();
    const toolConfigs$: Observable<GetToolConfigRequest[]> =
      this.toolConfigService.getToolConfigs();

    this.subscriptions.add(
      forkJoin([llmConfigs$, embeddingConfigs$, toolConfigs$])
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: ([llmConfigs, embeddingConfigs, toolConfigs]) => {
            this.llmConfigs = llmConfigs;
            this.embeddingConfigs = embeddingConfigs;
            this.existingToolConfigs = toolConfigs.filter(
              (config) => config.tool === this.tool.id
            );

            this.selectInitialConfig();
            // Initialize filteredConfigs
            this.filteredConfigs = [...this.existingToolConfigs];
            this.onFilteredConfigsChange(this.filteredConfigs);
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error fetching configurations:', err);
          },
        })
    );
  }

  private selectInitialConfig(): void {
    if (this.existingToolConfigs && this.existingToolConfigs.length > 0) {
      this.selectedConfig = this.existingToolConfigs[0];
    } else {
      this.selectedConfig = null; // No configs -> creation mode
    }
    this.cdr.detectChanges();
  }

  // Methods that were previously in the child component
  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.currentSearchQuery = inputElement.value.toLowerCase().trim();
    this.searchHasContent = this.currentSearchQuery.length > 0;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.currentSearchQuery === '') {
      this.filteredConfigs = [...this.existingToolConfigs];
    } else {
      this.filteredConfigs = this.existingToolConfigs.filter((config) =>
        config.name.toLowerCase().includes(this.currentSearchQuery)
      );
    }

    this.onFilteredConfigsChange(this.filteredConfigs);
  }

  onSelect(config: ToolConfig): void {
    this.onConfigSelected(config);
  }

  onCreateNew(): void {
    this.createNewConfig();
  }

  deleteFromList(config: ToolConfig, event: MouseEvent): void {
    this.onDeleteConfig(config);
  }

  // Existing parent methods
  onFilteredConfigsChange(filteredConfigs: ToolConfig[]): void {
    this.currentFilteredConfigs = filteredConfigs;
    this.cdr.detectChanges();
    console.log(this.currentFilteredConfigs);
  }

  onConfigSelected(config: ToolConfig): void {
    this.selectedConfig = config; // editing mode
    this.cdr.detectChanges();
  }

  createNewConfig(): void {
    this.selectedConfig = null; // creation mode
    this.cdr.detectChanges();
  }

  onFormSubmit(updatedConfig: ToolConfig): void {
    const index = this.existingToolConfigs.findIndex(
      (c) => c.id === updatedConfig.id
    );
    if (index !== -1) {
      this.existingToolConfigs[index] = updatedConfig; // Update
    } else {
      this.existingToolConfigs.push(updatedConfig); // Add new
    }
    this.selectedConfig = updatedConfig;
    this.applyFilter(); // Re-apply filter to update filteredConfigs
    this.cdr.markForCheck();
  }

  onDeleteConfig(config: ToolConfig): void {
    this._confirmationDialogService
      .confirmDelete(config.name)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (confirmed) => {
          if (confirmed) {
            this.toolConfigService
              .deleteToolConfig(config.id)
              .pipe(takeUntil(this._destroy$))
              .subscribe({
                next: () => {
                  // Remove the config from existing configs
                  this.existingToolConfigs = this.existingToolConfigs.filter(
                    (c) => c.id !== config.id
                  );

                  // Re-apply filter to update filtered configs
                  this.applyFilter();

                  // If there are remaining configs, select the first one
                  if (this.filteredConfigs.length > 0) {
                    this.selectedConfig = this.filteredConfigs[0];
                  } else {
                    this.selectedConfig = null;
                  }

                  this.cdr.detectChanges();
                },
                error: (err) => {
                  console.error('Error deleting configuration:', err);
                },
              });
          }
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
