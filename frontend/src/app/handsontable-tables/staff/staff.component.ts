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

import {
  ChangeAgent,
  ChangeSource,
  isRowValid,
} from '../table-utils/universal_handsontable_utils';
import { Agent, CreateAgentRequest } from '../../shared/models/agent.model';

import { AgentsService } from '../../services/staff.service';
import {
  catchError,
  finalize,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import { ToolsService } from '../../services/tools.service';
import { Tool } from '../../shared/models/tool.model';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

//table-utils
import {
  handleAfterOnCellMouseDown,
  handleBeforeKeyDown,
  handleEnterMoves,
} from '../table-utils/cell-renderers/tools-selector-dialog-utility/tools-selector-dialog-utility';
import { manualRowResizeRenderer } from '../table-utils/cell-renderers/manual-row-resize-renderer.ts/row-resize-renderer';
import { createCustomAgentLlmSelectRenderer } from '../table-utils/cell-renderers/select-llm-renderer/custom-llm-selector-renderer';
import { getInvalidRows } from '../table-utils/universal_handsontable_utils';

//validators
import { validateNotEmpty } from '../table-utils/column-validators/validate-not-empty-validator';
import { validateTemperatureField } from '../table-utils/column-validators/temperature-validator';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { validateToolsField } from '../table-utils/column-validators/validate-tools-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CreateAgentFormComponent } from '../../components/form-dialogs/create-agent-form-dialog/create-agent-form-dialog.component';
import { ToolSelectorComponent } from '../../main/tools-selector-dialog/tool-selector-dialog.component';
import { RangeType } from 'handsontable/plugins/copyPaste';
import { beforeChangeHandler } from './staff-table-utils/staff-table-event-handlers/before-change-handler';
import { LLM_Model } from '../../shared/models/LLM.model';
import { LLM_Models_Service } from '../../services/LLM_models.service';

@Component({
  selector: 'app-agents-table-2',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
  ],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StaffComponent implements OnInit, OnDestroy {
  @ViewChild('staffTableContainer', { static: false })
  public hotContainer!: ElementRef;

  public originalAgentsTableData: Agent[] = [];
  private agentsTableData: Agent[] = [];
  private toolsData: Tool[] = [];

  changedetecttoncounet = 0;
  ngDoCheck() {
    this.changedetecttoncounet++;
    console.log('detection trigered', this.changedetecttoncounet);
  }
  //Table settings
  private hotInstance!: Handsontable.Core;
  private columns!: Handsontable.ColumnSettings[];
  private hotSettings!: Handsontable.GridSettings;

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  // Loading state
  public isLoading: boolean = true;
  private isViewInitialized: boolean = false;
  private isDataReady: boolean = false;

  //searching logic
  public searchQuery: string = '';

  //TOOLS MODAL TARGET COLUMN
  private readonly targetColumnName: string = 'Tools';

  //SELECT RENDERER LOGIC
  private llmModels: LLM_Model[] = [];
  public llmOptions: string[] = [];
  private eventListenerRefs: Array<() => void> = [];

  private llmCellRenderer = createCustomAgentLlmSelectRenderer(
    this.llmOptions,
    this.eventListenerRefs
  );

  //hidden column functionality
  // public hideDefaultColumns: boolean = false; //toggled by checkbox
  // private columnsToToggle: number[] = [5, 6, 7, 8, 9, 10, 11];

  // public onHideDefaultColumnsChange(): void {
  //   this.updateHiddenColumns();
  // }

  // private updateHiddenColumns(): void {
  //   if (this.hotInstance) {
  //     const hiddenColumns: number[] = this.hideDefaultColumns
  //       ? this.columnsToToggle
  //       : [];
  //     this.hotInstance.updateSettings({
  //       hiddenColumns: {
  //         columns: hiddenColumns,
  //       },
  //     });
  //   }
  // }

  private colHeaders: string[] = [
    'Comments',
    'Agent Role',
    'Goal',
    'Backstory',
    'Tools',
    'Delegation',
    'Iterations',
    'Agent LLM',
    'Function LLM',
  ];

  private defineColumns(): void {
    this.columns = [
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
        validator: validateNotEmpty(this.snackbarService),
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-role-column-style ',
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
        // validator: validateToolsField(this.toolsData, this.snackbarService),
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
      // {
      //   data: 'verbose',
      //   type: 'checkbox',
      //   headerClassName:
      //     'staff-table-default-column-header-style vertical-header',
      //   className: 'htCenter htMiddle',
      // },
      // {
      //   data: 'tools',
      //   type: 'select',
      //   headerClassName:
      //     'staff-table-default-column-header-style vertical-header',
      //   className: 'htCenter htMiddle',
      // },
      // {
      //   data: 'memory',
      //   type: 'checkbox',
      //   headerClassName:
      //     'staff-table-default-column-header-style vertical-header',
      //   className: 'htCenter htMiddle',
      // },
      {
        data: 'max_iter',
        type: 'numeric',
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htBottom',
      },

      // {
      //   data: 'temperature',
      //   type: 'numeric',
      //   validator: validateTemperatureField(this.snackbarService),
      //   headerClassName:
      //     'staff-table-default-column-header-style vertical-header',
      //   className: 'htBottom',
      // },
      {
        data: 'llm_model',
        source: this.llmOptions,
        renderer: this.llmCellRenderer,
        editor: false,

        headerClassName: 'staff-table-default-column-header-style',
      },

      {
        data: 'fcm_llm_model',
        source: this.llmOptions,
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
    private dialog: MatDialog,
    private snackbarService: SharedSnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.hotSettings = {
      stretchH: 'all',
      width: '100%',
      height: '100%',

      colWidths: [100, 150, 200, 300, 150, 40, 40, 100, 100],
      colHeaders: this.colHeaders,
      columns: this.columns,

      rowHeaders: true,
      rowHeights: 93,
      wordWrap: true,

      selectionMode: 'range',
      //undoredo
      undo: true,

      //optimization
      // viewportRowRenderingOffset: 40,
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

      dataSchema: {
        comments: '',
        role: '',
        goal: '',
        backstory: '',
        memory: false,
        allow_delegation: true,
        max_iter: 15,
        // memory: false,
        // temperature: 0.5,
        llm_model: null,
        fcm_llm_model: null,
      },

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

      beforeChange: (changes, source) =>
        beforeChangeHandler(changes, source, this.snackbarService),

      afterChange: this.afterChangeHandler.bind(this),

      beforeBeginEditing: (row: number, column: number): void | boolean => {
        const colHeaders = this.hotInstance.getColHeader() as string[];
        const columnName = colHeaders[column];

        if (columnName === this.targetColumnName) {
          this.onOpenToolSelectorDialog(row, column);
          return false; // Prevent the default editor from opening
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
            name: 'Delete row(s)',
            callback: (key, selection, clickEvent) => {
              console.log(selection);

              this.handleDeleteRows(selection);
            },
          },
        },
      },
    };
  }

  private handleDeleteRows(
    selection: Array<{
      start: Handsontable.CellCoords;
      end: Handsontable.CellCoords;
    }>
  ): void {
    const rowsToDelete: number[] = [];

    // Collect row indixes from the selection
    selection.forEach(({ start, end }) => {
      const startRow = Math.min(start.row, end.row);
      const endRow = Math.max(start.row, end.row);

      for (let row = startRow; row <= endRow; row++) {
        rowsToDelete.push(row);
      }
    });

    // Remove duplicates and sort rows in descending order
    const uniqueRowsToDelete: number[] = Array.from(new Set(rowsToDelete)).sort(
      (a, b) => b - a
    );

    // Define the maximum number of concurrent deletions
    const MAX_CONCURRENT = 5;

    // Process deletions concurrently with a limit
    from(uniqueRowsToDelete)
      .pipe(
        mergeMap(
          (rowIndex: number) => {
            const agentData: Agent = this.hotInstance.getSourceDataAtRow(
              rowIndex
            ) as Agent;
            const id = this.agentsTableData[rowIndex].id;
            console.log(id);

            if (agentData && agentData.id) {
              // Existing agent, send delete request
              return this.agentsService.deleteAgent(agentData.id).pipe(
                map(() => ({ rowIndex, success: true, agentData })),
                catchError((error) => {
                  console.error(`Error deleting agent ${agentData.id}:`, error);
                  this.snackbarService.showSnackbar(
                    `Failed to delete agent ${agentData.id}. Please try again.`,
                    'error'
                  );
                  // Return an object indicating failure to continue the sequence
                  return of({ rowIndex, success: false, agentData });
                })
              );
            } else {
              // New agent (no id), remove immediately
              return of({ rowIndex, success: true, agentData });
            }
          },
          MAX_CONCURRENT // Concurrency limit
        ),
        finalize(() => {
          this.hotInstance.render();
        })
      )
      .subscribe({
        next: ({ rowIndex, success, agentData }) => {
          if (success) {
            if (agentData.id) {
              this.originalAgentsTableData =
                this.originalAgentsTableData.filter(
                  (agent) => agent.id !== agentData.id
                );
            }
            this.hotInstance.alter('remove_row', rowIndex);
          }
        },
        error: (error) => {
          console.error('Error deleting agents:', error);
          this.snackbarService.showSnackbar(
            `Failed to delete some agents. Please try again.`,
            'error'
          );
        },
        complete: () => {
          this.snackbarService.showSnackbar(
            `Selected agent(s) deleted successfully.`,
            'success'
          );
        },
      });
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.isDataReady) {
      this.initializeHandsontable();
    }
  }

  ngOnInit(): void {
    this.fetchAgentsAndTools();
  }

  private fetchAgentsAndTools(): void {
    const forkJoinSubscription: Subscription = forkJoin({
      agents: this.agentsService.getAgents(),
      tools: this.toolsService.getTools(),
    }).subscribe({
      next: ({ agents, tools }) => {
        // Directly assign tools and agents to the respective properties
        this.toolsData = tools; // Assuming tools are in the `results` array
        this.originalAgentsTableData = agents.results.map((agent: Agent) => ({
          ...agent,
          // toolTitles: this.getToolTitlesFromTools(agent.tools),
        }));

        // Apply filter (will initialize agentsTableData and add empty agent)
        this.applyFilter();

        this.isDataReady = true; // Data and columns are ready

        // Trigger change detection for UI updates
        this.cdr.detectChanges();

        // Initialize Handsontable if the view is already initialized
        if (this.isViewInitialized) {
          this.initializeHandsontable();
        }
      },
      error: (error) => {
        console.error('Error fetching agents or tools:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });

    this.subscriptions.add(forkJoinSubscription);
  }

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value.toLowerCase();
    this.applyFilter();
  }

  private createEmptyAgent(): CreateAgentRequest {
    return {
      tools: [],
      role: '',
      goal: '',
      backstory: '',
      allow_delegation: false,
      memory: false,
      max_iter: 5,
      llm_model: null,
      fcm_llm_model: null,
      llm_config: null,
      fcm_llm_config: null,
      // comments: '',
    };
  }

  private applyFilter(): void {
    if (!this.searchQuery) {
      // If no search query, show all agents
      this.agentsTableData = [...this.originalAgentsTableData];
      console.log(this.agentsTableData);
    } else {
      const query: string = this.searchQuery.toLowerCase();

      this.agentsTableData = this.originalAgentsTableData.filter(
        (agent: Agent) => {
          return (
            (agent.role && agent.role.toLowerCase().includes(query)) ||
            (agent.goal && agent.goal.toLowerCase().includes(query)) ||
            (agent.backstory &&
              agent.backstory.toLowerCase().includes(query)) ||
            (agent.toolTitles && agent.toolTitles.toLowerCase().includes(query))
          );
        }
      );
    }

    // Add an empty row for new agents
    // this.agentsTableData.push(this.createEmptyAgent());

    // Update Handsontable data
    if (this.hotInstance) {
      this.hotInstance.loadData(this.agentsTableData);
    }
  }

  // private getToolTitlesFromTools(tools_Ids: number[] | undefined): string {
  //   if (!tools || tools.length === 0) return '';
  //   return tools.map((tool) => tool.name).join(', ');
  // }

  private initializeHandsontable(): void {
    if (this.hotContainer && this.hotContainer.nativeElement) {
      this.defineColumns();
      this.hotInstance = new Handsontable(this.hotContainer.nativeElement, {
        ...this.hotSettings,
        data: this.agentsTableData,
        columns: this.columns,
      });
      this.hotInstance.render();
    } else {
      console.error('Container element not found!');
    }
  }

  private afterChangeHandler(
    changes: any,
    source: Handsontable.ChangeSource
  ): void {
    if (changes === null) return;
    const modifiedRows = new Set<number>();

    changes.forEach(([row, prop, oldValue, newValue]: any) => {
      if (oldValue === newValue) return;

      modifiedRows.add(row);
    });

    modifiedRows.forEach((row) => {
      this.sendRowUpdate(row);
    });
  }

  private sendRowUpdate(rowIndex: number): void {
    // Get the latest data from Handsontable
    let agentData: Agent = this.hotInstance.getSourceDataAtRow(
      rowIndex
    ) as Agent;
    console.log(agentData);

    // STEP 1: Check if row is valid
    const isRowValidResult = isRowValid(rowIndex, this.hotInstance);

    // STEP 2: If row is valid then update agent tools
    // agentData.tools = this.updateAgentTools(agentData.toolTitles);

    if (!isRowValidResult) {
      console.log(`Row ${rowIndex} contains invalid data. Skipping update.`);
      return;
    }

    // console.log('after updating tools', agentData);
    // STEP 3: Update or create based on agent.id
    if (agentData.id === 0) {
      if (!this.areRequiredFieldsFilled(agentData)) {
        return;
      }
      // Create a new agent via the service
      this.agentsService.createAgent(agentData).subscribe({
        next: (createdAgent: Agent) => {
          console.log(`Agent created successfully:`, createdAgent);
          this.agentsTableData[rowIndex] = agentData;
          this.originalAgentsTableData.push(agentData);

          this.snackbarService.showSnackbar(
            `Agent(s) created successfully.`,
            'success'
          );
          const lastRowIndex = this.hotInstance.countRows() - 1;
          const lastRowData = this.hotInstance.getSourceDataAtRow(
            lastRowIndex
          ) as Agent;

          if (lastRowData.id !== 0) {
            // Last row has an agentId, so we can add a new row
            this.hotInstance.alter('insert_row_below', lastRowIndex);
          } else {
            // Last row is already empty; no need to add a new row
            console.log('Last row is already empty. No need to add a new row.');
          }
        },
        error: (error) => {
          console.error(`Error creating agent:`, error);
          this.snackbarService.showSnackbar(
            `Failed to create agent. Please try again.`,
            'error'
          );
        },
      });
    } else {
      this.agentsService.updateAgent(agentData).subscribe({
        next: () => {
          console.log(`Agent updated successfully:`, agentData);

          const index: number = this.originalAgentsTableData.findIndex(
            (agent) => agent.id === agentData.id
          );
          if (index !== -1) {
            this.originalAgentsTableData[index] = agentData;
          }

          // this.applyFilter();
          this.snackbarService.showSnackbar(
            `Agent updated successfully.`,
            'success'
          );
        },
        error: (error) => {
          console.error(`Error updating agent ${agentData.id}:`, error);
          this.snackbarService.showSnackbar(
            `Failed to update agent ${agentData.id}. Please try again.`,
            'error'
          );
        },
      });
    }
  }

  private areRequiredFieldsFilled(agentData: Agent): boolean {
    const roleFilled = agentData.role != null && agentData.role.trim() !== '';
    const goalFilled = agentData.goal != null && agentData.goal.trim() !== '';
    const backstoryFilled =
      agentData.backstory != null && agentData.backstory.trim() !== '';
    return roleFilled && goalFilled && backstoryFilled;
  }

  private updateAgentTools(agentToolTitles: string | undefined) {
    const toolTitlesArray: string[] = agentToolTitles
      ? agentToolTitles
          .split(',')
          .map((toolName: string) => toolName.trim())
          .filter((toolName) => toolName.length > 0)
      : [];

    const updatedTools: Tool[] = toolTitlesArray
      .map((title: string) => {
        const tool: Tool | undefined = this.toolsData.find(
          (t) => t.name.toLowerCase() === t.name.toLowerCase()
        );
        return tool || null;
      })
      .filter((tool): tool is Tool => tool !== null);

    return updatedTools;
    // return agentData;
  }

  private afterCreateRowHandler(
    index: number,
    amount: number,
    source?: Handsontable.ChangeSource
  ): void {
    console.log(
      `Rows added at index ${index}, amount: ${amount}, source: ${
        source || 'unknown'
      }`
    );

    setTimeout(() => {
      this.hotInstance.selectCell(index, 1);
    }, 0);

    this.hotInstance.render();
  }

  public canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    const invalidRows: number[] = getInvalidRows(this.hotInstance);

    if (invalidRows.length > 0) {
      return this.showConfirmationDialog(invalidRows);
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

    // Open the dialog with toolsData and selectedTools
    const dialogRef = this.dialog.open(ToolSelectorComponent, {
      maxWidth: 'none',
      data: {
        toolsData: this.toolsData,
        selectedTools: selectedTools,
      },

      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((selectedTools: Tool[] | undefined) => {
      if (selectedTools) {
        // Convert selected Tools back to a string of tool names
        const selectedToolNames = selectedTools
          .map((tool) => tool.name)
          .join(', ');

        // Update the cell value with the new tool names
        this.hotInstance.setDataAtCell(row, column, selectedToolNames);
      }
    });
  }

  onOpenCreateAgentFormDialog(): void {
    const dialogRef = this.dialog.open(CreateAgentFormComponent, {
      data: { toolsData: this.toolsData },
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .subscribe((agentData: CreateAgentRequest | undefined) => {
        if (agentData) {
          // Handle the result from the form (e.g., create the agent)
          console.log('Agent data received from form:', agentData);

          // this.addNewAgent(agentData);
        }
      });
  }

  // private addNewAgent(agentData: CreateAgentRequest): void {
  //   // Send the agent data to the backend
  //   this.agentsService.createAgent(agentData).subscribe({
  //     next: () => {
  //       this.originalAgentsTableData.push(agentData);

  //       this.applyFilter();

  //       const newRowIndex = this.agentsTableData.findIndex(
  //         (agent) => agent.id === agentData.id
  //       );
  //       if (newRowIndex >= 0) {
  //         this.hotInstance.selectCell(newRowIndex, 1);
  //       }

  //       // Show a success message
  //       this.snackbarService.showSnackbar(
  //         `Agent "${agentData.role}" created successfully.`,
  //         'success'
  //       );
  //     },
  //     error: (error) => {
  //       console.error(`Error creating agent:`, error);
  //       this.snackbarService.showSnackbar(
  //         `Failed to create agent. Please try again.`,
  //         'error'
  //       );
  //     },
  //   });
  // }

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
