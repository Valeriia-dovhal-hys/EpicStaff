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
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { validateToolsField } from '../table-utils/column-validators/validate-tools-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CreateAgentFormComponent } from '../../forms/create-agent-form-dialog/create-agent-form-dialog.component';
import { ToolSelectorComponent } from '../../main/tools-selector-dialog/tool-selector-dialog.component';

import { LLM_Model } from '../../shared/models/LLM.model';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { createCustomStatusRenderer } from '../table-utils/cell-renderers/select-llm-renderer/custom-status-renderer';

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
  [key: string]: any; // Optional: For any additional properties
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

  public originalAgentsTableData: Agent[] = [];
  private agentsTableData: any[] = [];
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
  public isTableInitialized: boolean = true;
  private isViewInitialized: boolean = false;
  private isDataReady: boolean = false;

  //searching logic
  public searchQuery: string = '';

  //TOOLS MODAL TARGET COLUMN
  private readonly targetColumnName: string = 'Tools';

  //SELECT RENDERER LOGIC
  private llmModels: LLM_Model[] = [];
  private llmCellRenderer: any;
  private eventListenerRefs: Array<() => void> = [];

  //test
  // Mocked providers
  // Mocked data
  currentRow: number | null = null;
  currentCol: number | null = null;
  providers = [
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },

    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },

    { id: 2, name: 'Provider B' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 2, name: 'Provider B' },

    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },

    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 2, name: 'Provider B' },

    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },

    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
    { id: 2, name: 'Provider B' },
    { id: 1, name: 'Provider A' },
    { id: 2, name: 'Provider B' },
  ];

  llmModelsMock = [
    {
      id: 1,
      name: 'LLM 1',
      description: null,
      base_url: null,
      deployment: null,
      llm_provider: 1,
    },
    {
      id: 2,
      name: 'LLM 2',
      description: null,
      base_url: null,
      deployment: null,
      llm_provider: 1,
    },
    {
      id: 3,
      name: 'LLM 3',
      description: null,
      base_url: null,
      deployment: null,
      llm_provider: 2,
    },
  ];

  // Create the renderer
  statusCellRenderer = createCustomStatusRenderer(
    this.providers,
    this.llmModelsMock,
    this.eventListenerRefs
  );

  // Popup control properties
  // Popup control properties
  showPopup: boolean = false;
  popupStyles: any = {};
  selectedLlmName: string = '';
  selectedProviderId: number | null = null;
  llmsForProvider: LLM_Model[] = [];
  //end test

  private colHeaders: string[] = [
    'Comments',
    'Agent Role',
    'Goal',
    'Backstory',
    'Tools',
    'Delegation',
    'Memory',
    'Iterations',
    // 'Agent LLM',
    // 'Function LLM',
    // 'Agent LLM',
    // 'Function LLM'
    'Temperature 1',
    'Context 1',
    'Agent LLM',
    'Temperature 2',
    'Context 2',
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
        data: 'allowDelegation',
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
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htBottom',
      },
      // {
      //   data: 'llm_model_name',
      //   renderer: this.llmCellRenderer,
      //   editor: false,
      //   headerClassName: 'staff-table-default-column-header-style',
      // },
      // {
      //   data: 'fcm_llm_model_name',
      //   renderer: this.llmCellRenderer,
      //   editor: false,
      //   headerClassName: 'staff-table-default-column-header-style',
      // },
      // {
      //   data: 'status',
      //   renderer: this.statusCellRenderer,
      //   editor: false, // Disable default editor
      //   headerClassName: 'staff-table-default-column-header-style',
      // },
      // {
      //   data: 'status2',
      //   renderer: this.statusCellRenderer,
      //   editor: false, // Disable default editor
      //   headerClassName: 'staff-table-default-column-header-style',
      // },
      {
        data: 'temp1',
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htCenter htMiddle',
      },
      {
        data: 'context1',
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htCenter htMiddle',
      },
      {
        data: 'status',
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-llm-column htBottom htRight',
      },
      {
        data: 'temp2',
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htCenter htMiddle',
      },
      {
        data: 'context2',
        headerClassName:
          'staff-table-default-column-header-style vertical-header',
        className: 'htCenter htMiddle',
      },
      {
        data: 'status2',
        headerClassName: 'staff-table-default-column-header-style',
        className: 'staff-table-llm-column htBottom htRight',
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

      colWidths: [
        100, 150, 200, 300, 150, 40, 40, 40, 40, 40, 100, 40, 40, 100,
      ],
      colHeaders: this.colHeaders,
      columns: this.columns,

      rowHeaders: true,
      rowHeights: 93,
      wordWrap: true,

      selectionMode: 'range',
      fillHandle: false,
      //undoredo
      undo: true,

      dataSchema: {
        tools: [],
        role: '',
        goal: '',
        backstory: '',
        allow_delegation: false,
        memory: false,
        max_iter: 15,
        llm_model: null,
        fcm_llm_model: null,
        llm_config: null,
        fcm_llm_config: null,
        llm_model_name: null,
        fcm_llm_model_name: null,
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

      // beforeChange: (changes, source) =>
      //   beforeChangeHandler(changes, source, this.snackbarService),

      afterChange: this.afterChangeHandler.bind(this),

      beforeBeginEditing: (row: number, column: number): void | boolean => {
        const columnName: string = this.colHeaders[column];

        if (columnName === this.targetColumnName) {
          this.onOpenToolSelectorDialog(row, column);
          return false;
        }
        if (columnName === 'Agent LLM' || columnName === 'Function LLM') {
          this.onOpenPopup(row, column);
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
              this.handleDeleteRows(selection);
            },
          },
        },
      },
    };
  }

  onOpenPopup(row: number, column: number) {
    // Store the current cell position
    this.currentRow = row;
    this.currentCol = column;

    // Get the cell's data and cast it to AgentDataRow
    const cellData = this.hotInstance.getSourceDataAtRow(row) as AgentDataRow;

    // Determine which column is being edited
    const columnName: string = this.colHeaders[column];

    // Initialize popup data
    this.selectedLlmName = '';
    this.selectedProviderId = null;

    if (columnName === 'Agent LLM') {
      this.selectedLlmName = cellData.llm_model_name || '';
    } else if (columnName === 'Function LLM') {
      this.selectedLlmName = cellData.fcm_llm_model_name || '';
    }

    // Determine the provider based on the selected LLM
    if (this.selectedLlmName) {
      const selectedLlm = this.llmModelsMock.find(
        (llm) => llm.name === this.selectedLlmName
      );
      if (selectedLlm) {
        this.selectedProviderId = selectedLlm.llm_provider;
      }
    }

    // If still not set, default to the first provider
    if (!this.selectedProviderId) {
      this.selectedProviderId =
        this.providers.length > 0 ? this.providers[0].id : null;
    }

    // Get LLMs for the selected provider
    if (this.selectedProviderId) {
      this.llmsForProvider = this.llmModelsMock.filter(
        (llm) => llm.llm_provider === this.selectedProviderId
      );
    } else {
      this.llmsForProvider = [];
    }

    // Get the cell's DOM element
    const cellElement = this.hotInstance.getCell(row, column);

    if (cellElement) {
      const cellRect = cellElement.getBoundingClientRect();

      // Set the styles to position the popup
      this.popupStyles = {
        top: `${cellRect.bottom}px`,
        left: `${cellRect.right}px`,
        transform: 'translateX(-100%)', // Shift popup to the left by its width
      };

      // Show the popup
      this.showPopup = true;
      this.cdr.detectChanges();

      // Handle clicks outside the popup to close it
      setTimeout(() => {
        document.addEventListener('click', this.onDocumentClick);
      });
    }
  }

  onProviderChange(event: any) {
    const selectedId = parseInt(event.target.value, 10);
    if (!isNaN(selectedId)) {
      this.selectedProviderId = selectedId;
      this.llmsForProvider = this.llmModelsMock.filter(
        (llm) => llm.llm_provider === selectedId
      );
      // Reset selectedLlmName if it's not in the new provider's LLMs
      if (
        !this.llmsForProvider.find((llm) => llm.name === this.selectedLlmName)
      ) {
        this.selectedLlmName = '';
      }
    } else {
      this.selectedProviderId = null;
      this.llmsForProvider = [];
      this.selectedLlmName = '';
    }
  }

  onLlmSelect(llm: LLM_Model) {
    if (this.currentRow !== null && this.currentCol !== null) {
      // Get the cell's data and cast it to AgentDataRow
      const cellData = this.hotInstance.getSourceDataAtRow(
        this.currentRow
      ) as AgentDataRow;

      const columnName: string = this.colHeaders[this.currentCol];

      if (columnName === 'Agent LLM') {
        cellData.llm_model_name = llm.name;
      } else if (columnName === 'Function LLM') {
        cellData.fcm_llm_model_name = llm.name;
      }

      // Update the cell display
      this.hotInstance.setDataAtCell(
        this.currentRow,
        this.currentCol,
        llm.name
      );
    }

    // Hide the popup
    this.closePopup();

    // Reset currentRow and currentCol
    this.currentRow = null;
    this.currentCol = null;
  }

  closePopup() {
    this.showPopup = false;
    this.cdr.detectChanges();
    document.removeEventListener('click', this.onDocumentClick);

    // Re-select the cell if desired
    if (this.currentRow !== null && this.currentCol !== null) {
      this.hotInstance.selectCell(this.currentRow, this.currentCol);
    }
  }

  onPopupClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
  }
  onDocumentClick = (event: MouseEvent) => {
    const popupElement = document.querySelector('.popup-container');
    if (popupElement && !popupElement.contains(event.target as Node)) {
      this.closePopup();
    }
  };

  private handleDeleteRows(
    selection: Array<{
      start: Handsontable.CellCoords;
      end: Handsontable.CellCoords;
    }>
  ): void {
    const rowsToDeleteSet = new Set<number>();
    const agentIdsToDeleteSet = new Set<number>();

    // Collect unique rows and agent IDs to delete
    selection.forEach(({ start, end }) => {
      const startRow = Math.min(start.row, end.row);
      const endRow = Math.max(start.row, end.row);

      for (let row = startRow; row <= endRow; row++) {
        rowsToDeleteSet.add(row);

        const agent = this.hotInstance.getSourceDataAtRow(row) as Agent;
        if (agent?.id) {
          agentIdsToDeleteSet.add(agent.id);
        }
      }
    });

    const rowsToDelete = Array.from(rowsToDeleteSet).sort((a, b) => b - a); // Sort descending
    const agentIdsToDelete = Array.from(agentIdsToDeleteSet);

    if (agentIdsToDelete.length > 0) {
      from(agentIdsToDelete)
        .pipe(
          mergeMap(
            (agentId) =>
              this.agentsService.deleteAgent(agentId).pipe(
                map(() => ({ agentId, success: true })),
                catchError((error) => {
                  console.error(`Error deleting agent ${agentId}:`, error);
                  return of({ agentId, success: false });
                })
              ),
            10
          ),
          toArray() // Collect all results
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

            // Remove all selected rows
            this.hotInstance.batch(() => {
              rowsToDelete.forEach((rowIndex) => {
                this.hotInstance.alter('remove_row', rowIndex, 1);
              });
            });

            // Update the agents table data
            this.agentsTableData = this.hotInstance.getSourceData() as Agent[];

            // Re-render the Handsontable grid
            this.hotInstance.render();
          },
          error: (error) => {
            console.error('Error deleting agents:', error);
            this.snackbarService.showSnackbar(
              `Failed to delete agents. Please try again.`,
              'error'
            );

            // Re-render the Handsontable grid in case of error
            this.hotInstance.render();
          },
        });
    } else {
      // No agents to delete from server, remove unsaved rows
      this.hotInstance.batch(() => {
        rowsToDelete.forEach((rowIndex) => {
          this.hotInstance.alter('remove_row', rowIndex, 1);
        });
      });

      this.snackbarService.showSnackbar(
        `Selected row(s) deleted successfully.`,
        'success'
      );

      // Update the agents table data
      this.agentsTableData = this.hotInstance.getSourceData() as Agent[];

      // Re-render the Handsontable grid
      this.hotInstance.render();
    }
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
      llmModels: this.llmModelsService.getLLMModels(),
    }).subscribe({
      next: ({ agents, tools, llmModels }) => {
        this.toolsData = tools;
        this.llmModels = llmModels;

        this.llmCellRenderer = createCustomAgentLlmSelectRenderer(
          this.llmModels,
          this.eventListenerRefs
        );

        this.agentsTableData = agents.map((agent: Agent) => ({
          ...agent,
          llm_model_name: this.getLLMModelNameById(agent.llm_model),
          fcm_llm_model_name: this.getLLMModelNameById(agent.fcm_llm_model),
          toolTitles: this.getToolTitlesFromTools(agent.tools),
        }));

        // Add a new empty agent at the end
        this.agentsTableData.push(this.createEmptyAgent());

        this.isDataReady = true;

        this.cdr.detectChanges();

        if (this.isViewInitialized) {
          this.initializeHandsontable();
        }
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isDataReady = true;
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

  private createEmptyAgent() {
    return {
      id: null,
      tools: [],
      role: '',
      goal: '',
      backstory: '',
      allow_delegation: false,
      memory: false,
      max_iter: 15,
      llm_model: null,
      fcm_llm_model: null,
      llm_config: null,
      fcm_llm_config: null,
      llm_model_name: null,
      fcm_llm_model_name: null,
      comments: '',
      toolTitles: '',
    };
  }

  private afterChangeHandler(changes: any, source: any): void {
    if (changes === null) return;
    // Ignore changes triggered programmatically
    if (source === 'createAgent' || source === 'updateAgent') {
      return;
    }

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

    // STEP 1: Check if row is valid
    const isRowValidResult: boolean = isRowValid(rowIndex, this.hotInstance);

    if (!isRowValidResult) {
      console.log(`Row ${rowIndex} contains invalid data. Skipping update.`);
      return;
    }

    // Agent doesn't have an ID yet (new agent)
    if (!this.allRequiredFieldsFilled(agentData)) {
      return;
    }

    // STEP 2: Update the agent's fields values
    agentData.tools = this.updateAgentTools(agentData.toolTitles);

    agentData.llm_model = this.getLLMModelIdByName(agentData.llm_model_name);
    agentData.fcm_llm_model = this.getLLMModelIdByName(
      agentData.fcm_llm_model_name
    );

    agentData.llm_config = 2;
    agentData.fcm_llm_config = 2;

    // STEP 3: Update or create based on agent.id
    if (!agentData.id) {
      this.agentsService.createAgent(agentData).subscribe({
        next: (createdAgent: Agent) => {
          console.log(`Agent created successfully:`, createdAgent);

          agentData.id = createdAgent.id;

          this.hotInstance.setDataAtRowProp(
            rowIndex,
            'id',
            createdAgent.id,
            'createAgent'
          );

          // Check if there's an empty row at the end
          if (!this.hasEmptyRowAtEnd()) {
            // Insert a new row at the end
            this.hotInstance.alter(
              'insert_row_below',
              this.hotInstance.countRows()
            );
          }

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
    } else {
      this.agentsService.updateAgent(agentData).subscribe({
        next: (response) => {
          console.log(this.agentsTableData);
          console.log(response);

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

  private hasEmptyRowAtEnd(): boolean {
    const totalRows = this.hotInstance.countRows();
    const lastRowIndex = totalRows - 1;
    const lastRowData = this.hotInstance.getSourceDataAtRow(
      lastRowIndex
    ) as Agent;

    return !lastRowData.id;
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

    dialogRef
      .afterClosed()
      .subscribe((agentData: CreateAgentRequest | undefined) => {
        if (agentData) {
          console.log('Agent data received from form:', agentData);
          this.addNewAgent(agentData);
        }
      });
  }

  private addNewAgent(agentData: CreateAgentRequest): void {
    this.agentsService.createAgent(agentData).subscribe({
      next: (createdAgent: Agent) => {
        createdAgent.llm_model_name = this.getLLMModelNameById(
          createdAgent.llm_model
        );
        createdAgent.fcm_llm_model_name = this.getLLMModelNameById(
          createdAgent.fcm_llm_model
        );

        this.agentsTableData.push(createdAgent);

        this.hotInstance.loadData(this.agentsTableData);
        this.hotInstance.render();

        const newRowIndex: number = this.agentsTableData.findIndex(
          (agent) => agent.id === createdAgent.id
        );
        if (newRowIndex >= 0) {
          this.hotInstance.selectCell(newRowIndex, 1);
        }

        // Show a success message
        this.snackbarService.showSnackbar(
          `Agent "${createdAgent.role}" created successfully.`,
          'success'
        );

        // Trigger change detection if necessary
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
