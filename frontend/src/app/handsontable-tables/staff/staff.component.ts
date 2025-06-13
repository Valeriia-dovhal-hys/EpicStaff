import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ViewEncapsulation,
  Inject,
} from '@angular/core';
import Handsontable from 'handsontable/base';

import { CommonModule, DOCUMENT } from '@angular/common';

import { isRowValid } from '../table-utils/universal_handsontable_utils';
import { Agent, CreateAgentRequest } from '../../shared/models/agent.model';

import { AgentsService } from '../../services/staff.service';
import {
  catchError,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  Subscription,
  tap,
  toArray,
} from 'rxjs';
import { ToolsService } from '../../services/tools.service';
import { Tool } from '../../shared/models/tool.model';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

//table-utils
import { manualRowResizeRenderer } from '../table-utils/cell-renderers/manual-row-resize-renderer.ts/row-resize-renderer';
import { createCustomAgentLlmSelectRenderer } from '../table-utils/cell-renderers/select-llm-renderer/custom-llm-selector-renderer';
import { getInvalidRows } from '../table-utils/universal_handsontable_utils';

//validators
import { validateNotEmpty } from '../table-utils/column-validators/validate-not-empty-validator';
import { ConfirmationDialogComponent } from '../table-utils/confirmation-dialog/confirmation-dialog.component';
import { validateToolsField } from '../table-utils/column-validators/validate-tools-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CreateAgentFormComponent } from '../../forms/create-agent-form-dialog/create-agent-form-dialog.component';
import { ToolSelectorComponent } from './tools-selector-dialog/tool-selector-dialog.component';

import { LLM_Model } from '../../shared/models/LLM.model';
import { LLM_Models_Service } from '../../services/LLM_models.service';

import { LLM_Config_Service } from '../../services/LLM_config.service';
import {
  CreateLLMConfigRequest,
  LLM_Config,
} from '../../shared/models/LLM_config.model';
import { validateTemperatureField } from '../table-utils/column-validators/temperature-validator';
import { createBeforeChangeHandler } from './staff-table-utils/staff-table-event-handlers/before-change-handler';
import { validateIsNumberField } from '../table-utils/column-validators/validate-is-number';
import { validateUniqueRole } from '../table-utils/column-validators/unique-role.validator';

interface AgentDataRow {
  tools: any[];
  role: string;
  goal: string;
  backstory: string;
  allow_delegation: boolean;
  memory: boolean;
  max_iter: number;
  llm_model: any;
  fcm_llm_model: any;
  llm_config: any;
  fcm_llm_config: any;
  llm_model_name: string | null;
  fcm_llm_model_name: string | null;
  comments: string;
  [key: string]: any;
}

@Component({
  selector: 'app-agents-table-2',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    MatDialogModule,
  ],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StaffComponent implements OnInit, OnDestroy {
  @ViewChild('staffTableContainer', { static: false })
  public hotContainer!: ElementRef;

  private agentsTableData: any[] = [];
  private toolsData: Tool[] = [];
  private llmConfigs: LLM_Config[] = [];

  //Table settings
  private hotInstance!: Handsontable.Core;
  private columns!: Handsontable.ColumnSettings[];
  private hotSettings!: Handsontable.GridSettings;

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  // Loading state
  public isTableInitialized: boolean = true;

  //TOOLS MODAL TARGET COLUMN
  private readonly targetColumnName: string = 'Tools';

  //SELECT RENDERER LOGIC
  private llmModels: LLM_Model[] = [];
  private llmCellRenderer: any;
  private eventListenerRefs: Array<() => void> = [];

  private colHeaders: string[] = [
    'ID',
    'llm_config_id',
    'fnc_llm_config_id',
    'Tags',
    'Agent Role',
    'Goal',
    'Backstory',
    'Tools',
    'Delegation',
    'Memory',
    'Iterations',
    'Creativity',
    'Context',
    'Agent LLM',
    'Function LLM',
  ];

  private defineColumns(): void {
    this.columns = [
      {
        data: 'id',
        readOnly: true,
      },
      {
        data: 'llm_config',
        readOnly: true,
      },
      {
        data: 'fcm_llm_config',
        readOnly: true,
      },
      {
        data: 'comments',
        type: 'text',
        renderer: manualRowResizeRenderer,
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-comments-column-style',
      },
      {
        data: 'role',
        type: 'text',
        renderer: manualRowResizeRenderer,
        validator: validateUniqueRole(this.snackbarService),
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-role-column-style',
      },
      {
        data: 'goal',
        type: 'text',
        renderer: manualRowResizeRenderer,
        validator: validateNotEmpty(this.snackbarService),
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-default-column-style',
      },
      {
        data: 'backstory',
        type: 'text',
        renderer: manualRowResizeRenderer,
        validator: validateNotEmpty(this.snackbarService),
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-default-column-style',
      },
      {
        data: 'toolTitles',
        type: 'text',
        renderer: manualRowResizeRenderer,
        validator: validateToolsField(this.toolsData, this.snackbarService),
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-default-column-style',
      },
      {
        data: 'allow_delegation',
        type: 'checkbox',
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htCenter htMiddle',
      },
      {
        data: 'memory',
        type: 'checkbox',
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htCenter htMiddle',
      },
      {
        data: 'max_iter',
        type: 'numeric',
        validator: validateIsNumberField(this.snackbarService),
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'staff-table-default-column-numeric-style htBottom',
      },
      {
        data: 'llm_temperature',
        type: 'numeric',
        validator: validateTemperatureField(this.snackbarService),
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'staff-table-default-column-numeric-style htBottom',
      },
      {
        data: 'llm_context',
        type: 'numeric',
        validator: validateIsNumberField(this.snackbarService),

        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'staff-table-default-column-numeric-style htBottom',
      },
      {
        data: 'llm_model_name',
        renderer: this.llmCellRenderer,
        editor: false,
        headerClassName: 'staff-table-default-column-header-style',
      },
      {
        data: 'fcm_llm_model_name',
        renderer: this.llmCellRenderer,
        editor: false,
        headerClassName: 'staff-table-default-column-header-style',
      },
    ];
  }

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private agentsService: AgentsService,
    private toolsService: ToolsService,
    private llmModelsService: LLM_Models_Service,
    private llmConfigsService: LLM_Config_Service,
    private dialog: MatDialog,
    private snackbarService: SharedSnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.hotSettings = {
      stretchH: 'all',
      width: '100%',
      height: '100%',

      colWidths: [
        0, 0, 0, 100, 150, 200, 300, 150, 40, 40, 40, 40, 40, 100, 100,
      ],
      colHeaders: this.colHeaders,
      columns: this.columns,

      rowHeaders: true,
      rowHeights: 75,
      wordWrap: true,

      selectionMode: 'range',
      fillHandle: true,
      //undoredo
      undo: true,

      hiddenColumns: {
        columns: [0, 1, 2],
        indicators: false,
      },

      dataSchema: {
        id: null,
        tools: [],
        role: '',
        goal: '',
        backstory: '',
        allow_delegation: false,
        memory: false,
        max_iter: 15,
        llm_model: 1,
        fcm_llm_model: 1,
        llm_config: null,
        fcm_llm_config: null,
        llm_model_name: 'gpt-3.5-turbo',
        fcm_llm_model_name: 'gpt-3.5-turbo',

        llm_temperature: 0.5,
        llm_context: 25,
        comments: '',
      },
      //optimization
      viewportRowRenderingOffset: 15,
      manualRowResize: true,
      manualRowMove: false,
      autoRowSize: false,
      autoColumnSize: false,
      renderAllRows: false,
      manualColumnResize: false,
      outsideClickDeselects: true,
      autoWrapRow: false,
      autoWrapCol: false,
      columnSorting: false,
      dropdownMenu: false,
      filters: false,
      minSpareRows: 0,
      // end optimization

      licenseKey: 'non-commercial-and-evaluation',

      afterGetRowHeader: (row: number, TH: HTMLTableCellElement) => {
        TH.className = 'staff-table-row-header-class';
      },

      afterRowResize: (
        newSize: number,
        row: number,
        isDoubleClick: boolean
      ) => {
        this.hotInstance.render();
      },

      afterCreateRow: this.afterCreateRowHandler.bind(this),

      afterChange: this.afterChangeHandler.bind(this),

      beforeBeginEditing: (row: number, column: number): void | boolean => {
        const columnName: string = this.colHeaders[column];

        if (columnName === this.targetColumnName) {
          this.onOpenToolSelectorDialog(row, column);
          return false;
        }
      },

      contextMenu: {
        items: {
          row_above: {
            name: 'Insert row above',
          },
          row_below: {
            name: 'Insert row below',
          },
          remove_row: {
            name: 'Delete agent(s)',
            callback: (key, selection, clickEvent) => {
              this.handleDeleteRows(selection);
            },
          },
        },
      },
    };
  }

  ngOnInit(): void {
    this.fetchAgentsAndTools();
  }

  private fetchAgentsAndTools(): void {
    const forkJoinSubscription: Subscription = forkJoin({
      agents: this.agentsService.getAgents(),
      tools: this.toolsService.getTools(),
      llmModels: this.llmModelsService.getLLMModels(),
      llmConfigs: this.llmConfigsService.getAllConfigsLLM(),
    }).subscribe({
      next: ({ agents, tools, llmModels, llmConfigs }) => {
        this.toolsData = tools;
        this.llmModels = llmModels;
        this.llmConfigs = llmConfigs;

        this.llmCellRenderer = createCustomAgentLlmSelectRenderer(
          this.llmModels,
          this.eventListenerRefs
        );

        this.agentsTableData = agents.map((agent: Agent) => {
          const llmConfig: LLM_Config | null = this.getLLMConfigById(
            agent.llm_config
          );

          return {
            ...agent,
            llm_model_name: this.getLLMModelNameById(agent.llm_model),
            fcm_llm_model_name: this.getLLMModelNameById(agent.fcm_llm_model),
            toolTitles: this.getToolTitlesFromTools(agent.tools),
            llm_temperature: llmConfig ? llmConfig.temperature : null,
            llm_context: llmConfig ? llmConfig.num_ctx : null,
          };
        });
        this.agentsTableData.sort((a: Agent, b: Agent) => a.id - b.id);

        // Add a new empty agent at the end
        this.agentsTableData.push(this.createEmptyAgent());

        this.cdr.detectChanges();

        this.initializeHandsontable();
      },
      error: (error) => {
        console.error('Error fetching data:', error);

        this.cdr.detectChanges();
      },
    });

    this.subscriptions.add(forkJoinSubscription);
  }

  private getLLMModelNameById(modelId: number | null): string {
    if (!modelId) return '';
    const model = this.llmModels.find((m) => m.id === modelId);
    return model ? model.name : '';
  }

  private getLLMModelIdByName(modelName: string | null): number | null {
    if (!modelName) return null;
    const model = this.llmModels.find((m) => m.name === modelName);
    return model ? model.id : null;
  }

  private getLLMConfigById(configId: number | null): LLM_Config | null {
    if (!configId) return null;
    const config: LLM_Config | undefined = this.llmConfigs.find(
      (c: LLM_Config) => c.id === configId
    );
    return config || null;
  }

  private getToolTitlesFromTools(tools_Ids: number[] | undefined): string {
    if (!tools_Ids || tools_Ids.length === 0) return '';
    return tools_Ids
      .map((toolId) => {
        const tool = this.toolsData.find((t) => t.id === toolId);
        return tool ? tool.name : '';
      })
      .filter((name) => name !== '')
      .join(', ');
  }

  private initializeHandsontable(): void {
    if (this.hotContainer && this.hotContainer.nativeElement) {
      this.defineColumns();

      this.hotSettings.beforeChange = createBeforeChangeHandler(
        this.snackbarService,
        this.llmModels
      );

      this.hotInstance = new Handsontable(this.hotContainer.nativeElement, {
        ...this.hotSettings,
        data: this.agentsTableData,
        columns: this.columns,
      });

      this.hotInstance.render();
      this.isTableInitialized = true;
    } else {
      console.error('Container element not found!');
    }
  }

  private handleDeleteRows(
    selection: Array<{
      start: Handsontable.CellCoords;
      end: Handsontable.CellCoords;
    }>
  ): void {
    const physicalRowsToDeleteSet = new Set<number>();
    const agentsToDelete: Agent[] = [];
    const deletedConfigIds = new Set<number>();

    // Collect unique physical rows and agents to delete
    selection.forEach(({ start, end }) => {
      const startRow = Math.min(start.row, end.row);
      const endRow = Math.max(start.row, end.row);

      for (let visualRow = startRow; visualRow <= endRow; visualRow++) {
        const physicalRow = this.hotInstance.toPhysicalRow(visualRow);
        physicalRowsToDeleteSet.add(physicalRow);

        const agent = this.agentsTableData[physicalRow] as Agent;
        if (agent?.id) {
          agentsToDelete.push(agent);
        }
      }
    });

    const physicalRowsToDelete = Array.from(physicalRowsToDeleteSet).sort(
      (a, b) => b - a
    ); // Sort descending

    if (agentsToDelete.length > 0) {
      from(agentsToDelete)
        .pipe(
          mergeMap(
            (agent) =>
              this.agentsService.deleteAgent(agent.id).pipe(
                mergeMap(() => {
                  const deleteConfigObservables: Observable<any>[] = [];

                  if (
                    agent.llm_config &&
                    !deletedConfigIds.has(agent.llm_config)
                  ) {
                    deletedConfigIds.add(agent.llm_config);
                    deleteConfigObservables.push(
                      this.llmConfigsService
                        .deleteConfig(agent.llm_config)
                        .pipe(
                          catchError((error) => {
                            console.error(
                              `Error deleting LLM config ${agent.llm_config}:`,
                              error
                            );
                            return of(null);
                          })
                        )
                    );
                  }

                  if (
                    agent.fcm_llm_config &&
                    !deletedConfigIds.has(agent.fcm_llm_config)
                  ) {
                    deletedConfigIds.add(agent.fcm_llm_config);
                    deleteConfigObservables.push(
                      this.llmConfigsService
                        .deleteConfig(agent.fcm_llm_config)
                        .pipe(
                          catchError((error) => {
                            console.error(
                              `Error deleting FCM LLM config ${agent.fcm_llm_config}:`,
                              error
                            );
                            return of(null);
                          })
                        )
                    );
                  }

                  if (deleteConfigObservables.length > 0) {
                    return forkJoin(deleteConfigObservables).pipe(
                      map(() => ({ agentId: agent.id, success: true }))
                    );
                  } else {
                    return of({ agentId: agent.id, success: true });
                  }
                }),
                catchError((error) => {
                  console.error(`Error deleting agent ${agent.id}:`, error);
                  return of({ agentId: agent.id, success: false });
                })
              ),
            100
          ),
          toArray()
        )
        .subscribe({
          next: (results) => {
            const failedDeletions = results
              .filter((result) => !result.success)
              .map((r) => r.agentId);

            if (failedDeletions.length > 0) {
              this.snackbarService.showSnackbar(
                `Failed to delete some agents. Please try again.`,
                'error'
              );
            } else {
              this.snackbarService.showSnackbar(
                `Selected agent(s) deleted successfully.`,
                'success'
              );
            }

            physicalRowsToDelete.forEach((physicalRowIndex) => {
              this.agentsTableData.splice(physicalRowIndex, 1);
            });

            this.hotInstance.loadData(this.agentsTableData);

            this.hotInstance.render();
          },
          error: (error) => {
            console.error('Error deleting agents:', error);
            this.snackbarService.showSnackbar(
              `Failed to delete agents. Please try again.`,
              'error'
            );

            this.hotInstance.render();
          },
        });
    } else {
      // No agents to delete from server, remove unsaved rows
      physicalRowsToDelete.forEach((physicalRowIndex) => {
        this.agentsTableData.splice(physicalRowIndex, 1);
      });

      this.snackbarService.showSnackbar(
        `Selected row(s) deleted successfully.`,
        'success'
      );

      this.hotInstance.loadData(this.agentsTableData);

      this.hotInstance.render();
    }
  }

  private createEmptyAgent() {
    return {
      id: null,
      comments: '',
      tools: [],
      role: '',
      goal: '',
      backstory: '',
      allow_delegation: false,
      memory: false,
      max_iter: 15,
      llm_model: 1,
      fcm_llm_model: 1,
      llm_config: null,
      fcm_llm_config: null,
      llm_model_name: 'gpt-3.5-turbo',
      fcm_llm_model_name: 'gpt-3.5-turbo',

      llm_temperature: 0.5,
      llm_context: 25,
      toolTitles: '',
    };
  }

  private afterChangeHandler(changes: any, source: any): void {
    if (changes === null) return;

    const modifiedAgents = new Set<number>();
    const modifiedConfigs = new Set<number>();
    changes.forEach(([row, prop, oldValue, newValue]: any) => {
      if (oldValue === newValue) return;

      if (prop === 'llm_temperature' || prop === 'llm_context') {
        modifiedConfigs.add(row);
      }

      modifiedAgents.add(row);
    });

    modifiedAgents.forEach((row) => {
      this.sendAgentUpdate(row);
    });

    modifiedConfigs.forEach((row) => {
      this.sendConfigUpdate(row);
    });
  }

  private sendConfigUpdate(rowIndex: number): void {
    // STEP 1: Check if row is valid
    const isRowValidResult: boolean = isRowValid(rowIndex, this.hotInstance);

    if (!isRowValidResult) {
      return;
    }

    let rowData: Agent = this.hotInstance.getSourceDataAtRow(rowIndex) as Agent;

    if (!rowData.id) {
      return;
    }

    if (rowData.llm_config) {
      const llmConfigData: CreateLLMConfigRequest = {
        temperature: rowData.llm_temperature,
        num_ctx: rowData.llm_context,
      };

      this.llmConfigsService
        .updateConfig(rowData.llm_config, llmConfigData)
        .subscribe({
          next: (response: LLM_Config) => {
            console.log('Config updated successfully:', response);
          },
          error: (error) => {
            console.error('Error updating config:', error);
          },
        });
    }
  }

  private sendAgentUpdate(rowIndex: number): void {
    // STEP 1: Check if row is valid
    const isRowValidResult: boolean = isRowValid(rowIndex, this.hotInstance);

    if (!isRowValidResult) {
      console.log(`Row ${rowIndex} contains invalid data. Skipping update.`);
      return;
    }

    // Get the latest data from Handsontable
    let agentData: Agent = this.hotInstance.getSourceDataAtRow(
      rowIndex
    ) as Agent;

    // STEP 2: Update the agent's fields values
    agentData.tools = this.updateAgentTools(agentData.toolTitles);
    agentData.llm_model = this.getLLMModelIdByName(agentData.llm_model_name);
    agentData.fcm_llm_model = this.getLLMModelIdByName(
      agentData.fcm_llm_model_name
    );

    // STEP 3: Update or create based on agent.id
    if (!agentData.id) {
      // required fields
      if (!this.allRequiredFieldsFilled(agentData)) {
        return;
      }

      const llmConfigData: CreateLLMConfigRequest = {
        temperature: agentData.llm_temperature,
        num_ctx: agentData.llm_context,
      };

      const functionConfigData: CreateLLMConfigRequest = {
        temperature: 0,
        num_ctx: 25,
      };

      // Use forkJoin to send both configuration requests in parallel
      const configSubscription: Subscription = forkJoin({
        createdConfig: this.llmConfigsService.createConfig(llmConfigData),
        createdFunctionConfig:
          this.llmConfigsService.createConfig(functionConfigData),
      }).subscribe({
        next: ({ createdConfig, createdFunctionConfig }) => {
          agentData.llm_config = createdConfig.id;
          agentData.fcm_llm_config = createdFunctionConfig.id;

          this.agentsService.createAgent(agentData).subscribe({
            next: (createdAgent: Agent) => {
              console.log(`Agent created successfully:`, createdAgent);

              this.agentsTableData[rowIndex].id = createdAgent.id;
              this.agentsTableData[rowIndex].llm_config = createdConfig.id;
              this.agentsTableData[rowIndex].fcm_llm_config =
                createdFunctionConfig.id;

              this.insertRowAtTheEnd();

              this.snackbarService.showSnackbar(
                `Agent created successfully.`,
                'success'
              );
            },
            error: (error) => {
              console.error(`Error creating agent:`, error);
              this.snackbarService.showSnackbar(
                `Failed to create agent. Please try again.`,
                'error'
              );
            },
          });
        },
        error: (error) => {
          console.error('Error creating LLM configs:', error);
          this.snackbarService.showSnackbar(
            `Failed to create LLM configs. Please try again.`,
            'error'
          );
        },
      });

      // Add the subscription to the subscriptions collection if you're managing subscriptions
      this.subscriptions.add(configSubscription);
    } else {
      // Update existing agent
      this.agentsService.updateAgent(agentData).subscribe({
        next: (response) => {
          this.snackbarService.showSnackbar(
            `Agent updated successfully.`,
            'success'
          );
        },
        error: (error) => {
          console.error(`Error updating agent ${agentData.role}:`, error);
          this.snackbarService.showSnackbar(
            `Failed to update agent ${agentData.role}. Please try again.`,
            'error'
          );
        },
      });
    }
  }

  private allRequiredFieldsFilled(agentData: Agent): boolean {
    if (!agentData) {
      return true;
    }
    const roleFilled: boolean =
      agentData.role != null && agentData.role.trim() !== '';
    const goalFilled: boolean =
      agentData.goal != null && agentData.goal.trim() !== '';
    const backstoryFilled: boolean =
      agentData.backstory != null && agentData.backstory.trim() !== '';
    return roleFilled && goalFilled && backstoryFilled;
  }

  private updateAgentTools(agentToolTitles: string | undefined): number[] {
    const toolTitlesArray: string[] = agentToolTitles
      ? agentToolTitles
          .split(',')
          .map((toolName: string) => toolName.trim())
          .filter((toolName) => toolName.length > 0)
      : [];

    const updatedToolIds: number[] = toolTitlesArray
      .map((title: string) => {
        const tool: Tool | undefined = this.toolsData.find(
          (t) => t.name.toLowerCase() === title.toLowerCase()
        );
        return tool ? tool.id : null;
      })
      .filter((toolId): toolId is number => toolId !== null);

    return updatedToolIds;
  }

  private insertRowAtTheEnd(): void {
    // Check if there's an empty row at the end
    if (!this.hasEmptyRowAtEnd()) {
      const totalRows = this.hotInstance.countRows();
      const lastRowIndex = totalRows - 1;

      // Insert a new row below the last row
      this.hotInstance.alter('insert_row_below', lastRowIndex, 1);
    }
  }

  private hasEmptyRowAtEnd(): boolean {
    const totalRows = this.hotInstance.countRows();
    const lastRowIndex = totalRows - 1;
    const lastRowData = this.hotInstance.getSourceDataAtRow(
      lastRowIndex
    ) as Agent;

    return !lastRowData.id;
  }

  private afterCreateRowHandler(
    index: number,
    amount: number,
    source?: Handsontable.ChangeSource
  ): void {
    setTimeout(() => {
      this.hotInstance.selectCell(index, 4);
    }, 0);

    this.hotInstance.render();
  }

  public canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.hotInstance) {
      const invalidRows: number[] = getInvalidRows(this.hotInstance);

      if (invalidRows.length > 0) {
        return this.showConfirmationDialog(invalidRows);
      }
    }

    return true;
  }

  private showConfirmationDialog(invalidRows: number[]): Observable<boolean> {
    const rowNumbers: number[] = invalidRows.map((row) => row + 1);
    const rowsString: string = rowNumbers.join(', ');

    const message: string = `Your table contains invalid data in the following row(s): ${rowsString}. Changes may not be saved if you navigate away. Do you want to proceed?`;

    const dialogRef: MatDialogRef<ConfirmationDialogComponent, any> =
      this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          message: message,
        },
      });

    return dialogRef.afterClosed();
  }

  onOpenToolSelectorDialog(row: number, column: number) {
    const cellValue: string = this.hotInstance.getDataAtCell(
      row,
      column
    ) as string;

    const toolNames: string[] = cellValue
      ? cellValue.split(',').map((name) => name.trim())
      : [];

    const selectedTools: Tool[] = this.toolsData.filter((tool) =>
      toolNames.includes(tool.name)
    );

    const dialogRef = this.dialog.open(ToolSelectorComponent, {
      data: {
        toolsData: this.toolsData,
        selectedTools: selectedTools,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((selectedTools: Tool[] | undefined) => {
      if (selectedTools) {
        const selectedToolNames: string = selectedTools
          .map((tool) => tool.name)
          .join(', ');
        this.hotInstance.setDataAtCell(row, column, selectedToolNames);
      }
    });
  }

  onOpenCreateAgentFormDialog(): void {
    const dialogRef = this.dialog.open(CreateAgentFormComponent, {
      data: { toolsData: this.toolsData },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const { agentData, llm_temperature, llm_context } = result;
        console.log('Agent data received from form:', agentData);
        this.addNewAgent(agentData, llm_temperature, llm_context);
      }
    });
  }

  private addNewAgent(
    agentData: CreateAgentRequest,
    llm_temperature: number,
    llm_context: number
  ): void {
    this.agentsService.createAgent(agentData).subscribe({
      next: (createdAgent: Agent) => {
        createdAgent.llm_model_name = this.getLLMModelNameById(
          createdAgent.llm_model
        );
        createdAgent.fcm_llm_model_name = this.getLLMModelNameById(
          createdAgent.fcm_llm_model
        );
        createdAgent.llm_temperature = llm_temperature;
        createdAgent.llm_context = llm_context;
        createdAgent.toolTitles = this.getToolTitlesFromTools(
          createdAgent.tools
        );

        if (this.hasEmptyRowAtEnd()) {
          this.agentsTableData.splice(
            this.agentsTableData.length - 1,
            0,
            createdAgent
          );
        } else {
          this.agentsTableData.push(createdAgent);
          this.agentsTableData.push(this.createEmptyAgent());
        }

        this.hotInstance.loadData(this.agentsTableData);

        this.hotInstance.render();

        const newRowIndex: number = this.agentsTableData.findIndex(
          (agent) => agent.id === createdAgent.id
        );
        if (newRowIndex >= 0) {
          this.hotInstance.selectCell(newRowIndex, 4);
        }

        this.snackbarService.showSnackbar(
          `Agent "${createdAgent.role}" created successfully.`,
          'success'
        );

        // Trigger change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`Error creating agent:`, error);
        this.snackbarService.showSnackbar(
          `Failed to create agent. Please try again.`,
          'error'
        );
      },
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.unsubscribe();

    // **Remove event listeners OF SELECTS**
    this.eventListenerRefs.forEach((cleanup) => cleanup());
    this.eventListenerRefs = [];

    if (this.hotInstance) {
      console.log('hotInstance detroyed');

      this.hotInstance.destroy();
    }
  }
}
