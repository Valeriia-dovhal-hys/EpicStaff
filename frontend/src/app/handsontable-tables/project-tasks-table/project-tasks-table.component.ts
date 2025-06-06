import {
  Component,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ViewEncapsulation,
  Input,
  SimpleChanges,
  OnChanges,
  AfterViewInit,
  Inject,
} from '@angular/core';
import Handsontable from 'handsontable/base';
import { Task } from '../../shared/models/task.model';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeTask,
  ChangeSource,
  isRowValid,
  getInvalidRows,
} from '../table-utils/universal_handsontable_utils';
import { Agent } from '../../shared/models/agent.model';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { validateNotEmpty } from '../table-utils/column-validators/validate-not-empty-validator';
import { catchError, from, map, mergeMap, Observable, of } from 'rxjs';
import { TasksService } from '../../services/tasks.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { mutual_Variables_RowResize_Renderer } from '../table-utils/cell-renderers/variables-cell-renderer/mutual_variables-manualresize-renderer-utility';
import { createAssignedAgentRoleRenderer } from './agentRolesRenderer';
import { VariablePopupComponent } from '../../main/variables/popup/popup.component';

interface Variable {
  title: string;
  value: string;
}

interface TaskTableRow extends Task {
  assignedAgentRole?: string; // For display purposes
}

@Component({
  selector: 'app-project-tasks-table',
  standalone: true,
  imports: [CommonModule, VariablePopupComponent],
  templateUrl: './project-tasks-table.component.html',
  styleUrls: ['./project-tasks-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ProjectTasksTableComponent
  implements OnDestroy, OnChanges, AfterViewInit
{
  @ViewChild('hotContainer', { static: true }) hotContainer!: ElementRef;
  @ViewChild(VariablePopupComponent)
  variablePopupComponent!: VariablePopupComponent;

  @Input() tasksTableData: Task[] = [];
  @Input() agentsData: Agent[] = [];
  @Input() variables?: Variable[] = [];
  @Input() projectId!: number;

  private tableData: TaskTableRow[] = [];
  private agentRoles: string[] = [];
  private eventListenerRefs: Array<() => void> = [];
  private assignedAgentRoleRenderer: any;

  private hotInstance!: Handsontable.Core;
  private columns!: Handsontable.ColumnSettings[];
  private hotSettings!: Handsontable.GridSettings;

  private colHeaders: string[] = [
    'Name',
    'Instructions',
    'Expected Output',
    'Order',
    'Assigned To',
  ];

  // Popup logic variables
  showPopup = false;
  popupPosition = { top: 0, left: 0 };
  currentEditorInput: HTMLTextAreaElement | null = null;
  isEditing = false;
  cursorPosition: number = 0;
  listenersAttached = false;

  private pattern: RegExp = /$^/;
  private cache: Map<string, DocumentFragment>;

  private unsubscribeEditorListeners: (() => void) | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private cdr: ChangeDetectorRef,
    private snackbarService: SharedSnackbarService,
    private tasksService: TasksService,
    private dialog: MatDialog
  ) {
    this.cache = new Map<string, DocumentFragment>();

    this.hotSettings = {
      stretchH: 'all',
      width: '100%',
      height: '100%',
      colWidths: [50, 200, 300, 50, 150],
      colHeaders: this.colHeaders,
      columns: this.columns,
      autoRowSize: true,
      autoColumnSize: true,
      renderAllRows: false,
      manualColumnResize: false,
      manualRowResize: true,
      outsideClickDeselects: true,
      autoWrapRow: false,
      autoWrapCol: false,
      minSpareRows: 0,
      manualRowMove: true,
      dataSchema: {
        id: null,
        crew: null,
        name: '',
        instructions: '',
        expected_output: '',
        order: 0,
        agent: null,
        assignedAgentRole: 'Not Assigned',
      },
      rowHeaders: true,
      rowHeights: 100,
      wordWrap: true,
      licenseKey: 'non-commercial-and-evaluation',
      contextMenu: {
        items: {
          row_above: { name: 'Insert row above' },
          row_below: { name: 'Insert row below' },
          remove_row: { name: 'Delete row(s)' },
        },
      },
      afterGetRowHeader: (row: number, TH: HTMLTableCellElement) => {
        TH.classList.add('project-tasks-table-row-header-class');
      },
      afterCreateRow: this.afterCreateRowHandler.bind(this),
      afterChange: (changes, source) => {
        this.afterChangeHandler(changes, source);
      },
    };
  }

  ngAfterViewInit() {
    if (!this.hotInstance) {
      this.initializeHandsontable();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    let dataChanged = false;

    if (changes['tasksTableData'] || changes['agentsData']) {
      this.processData();
      dataChanged = true;
    }

    if (this.hotInstance) {
      if (dataChanged) {
        this.hotInstance.loadData(this.tableData);
      }
      if (changes['agentsData'] || dataChanged) {
        this.hotInstance.updateSettings({
          columns: this.columns,
        });
      }
    } else {
      this.initializeHandsontable();
    }
  }

  private processData(): void {
    const agents = this.agentsData || [];
    const tasks = this.tasksTableData || [];

    // Map tasks to tableData, adding assignedAgentRole
    this.tableData = tasks.map((task) => {
      const agent = agents.find((a) => a.id === task.agent);
      const assignedAgentRole = agent ? agent.role : 'Not Assigned';
      return {
        ...task,
        assignedAgentRole,
      };
    });

    // Update the agent roles for the dropdown
    this.agentRoles = Array.from(new Set(agents.map((agent) => agent.role)));
    this.agentRoles.push('Not Assigned');

    // Initialize assignedAgentRoleRenderer
    this.assignedAgentRoleRenderer = createAssignedAgentRoleRenderer(
      this.agentRoles,
      this.eventListenerRefs,
      this.document
    );

    this.columns = [
      {
        data: 'name',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
        renderer: (instance, td, row, col, prop, value, cellProperties) =>
          mutual_Variables_RowResize_Renderer(
            instance,
            td,
            row,
            col,
            prop,
            value,
            cellProperties,
            this.cache,
            this.pattern
          ),
        headerClassName: 'htLeft',
      },
      {
        data: 'instructions',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
        renderer: (instance, td, row, col, prop, value, cellProperties) =>
          mutual_Variables_RowResize_Renderer(
            instance,
            td,
            row,
            col,
            prop,
            value,
            cellProperties,
            this.cache,
            this.pattern
          ),
        headerClassName: 'htLeft',
      },
      {
        data: 'expected_output',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
        renderer: (instance, td, row, col, prop, value, cellProperties) =>
          mutual_Variables_RowResize_Renderer(
            instance,
            td,
            row,
            col,
            prop,
            value,
            cellProperties,
            this.cache,
            this.pattern
          ),
        headerClassName: 'htLeft',
      },
      {
        data: 'order',
        type: 'numeric',
        headerClassName: 'htLeft',
      },
      {
        data: 'assignedAgentRole',
        renderer: this.assignedAgentRoleRenderer,
        editor: false,
        readOnly: false,
        headerClassName: 'htLeft',
      },
    ];

    // Update the dropdown source
    this.updateAssignedToColumnSource();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  private updateAssignedToColumnSource(): void {
    if (Array.isArray(this.columns)) {
      const assignedToColumn = this.columns.find(
        (col) => col.data === 'assignedAgentRole'
      );
      if (assignedToColumn) {
        assignedToColumn.source = this.agentRoles;
      }
    }
  }

  private initializeHandsontable(): void {
    if (this.hotContainer && this.hotContainer.nativeElement) {
      if (this.hotInstance) {
        this.hotInstance.destroy();
      }
      this.hotInstance = new Handsontable(this.hotContainer.nativeElement, {
        ...this.hotSettings,
        columns: this.columns,
        data: this.tableData,
      });
      this.hotInstance.render();
    }
  }

  private afterChangeHandler(
    changes: ChangeTask[] | null,
    source: ChangeSource
  ): void {
    if (
      !changes ||
      !(
        source === 'edit' ||
        source === 'CopyPaste.paste' ||
        source === 'customDropdown'
      )
    ) {
      return;
    }

    const modifiedRows = new Set<number>();

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue === newValue) return;
      modifiedRows.add(row);
    });

    modifiedRows.forEach((row) => {
      this.sendRowUpdate(row);
    });
  }

  private sendRowUpdate(row: number): void {
    const taskData: TaskTableRow = this.hotInstance.getSourceDataAtRow(
      row
    ) as TaskTableRow;

    // Check if row is valid
    const isRowValidResult = isRowValid(row, this.hotInstance);
    if (!isRowValidResult) {
      console.log(`Row ${row} contains invalid data. Skipping update.`);
      return;
    }

    // Update task's agent based on assignedAgentRole
    const selectedAgent = this.agentsData.find(
      (agent) => agent.role === taskData.assignedAgentRole
    );
    taskData.agent = selectedAgent ? selectedAgent.id : null;

    // Prepare task data to send to backend
    const taskToSend: Task = {
      id: taskData.id,
      crew: this.projectId,
      name: taskData.name,
      instructions: taskData.instructions,
      expected_output: taskData.expected_output,
      order: taskData.order,
      agent: taskData.agent,
    };

    if (!taskData.id) {
      // Create a new task via the service
      this.tasksService.createTask(taskToSend).subscribe({
        next: (createdTask) => {
          console.log(`Task created successfully:`, createdTask);
          // Update the task in tableData with new id and any other changes from backend
          this.tableData[row] = {
            ...createdTask,
            assignedAgentRole: taskData.assignedAgentRole,
          };
          this.hotInstance.render();

          this.snackbarService.showSnackbar(
            `Task ${createdTask.id} created successfully.`,
            'success'
          );
        },
        error: (error) => {
          console.error(`Error creating task:`, error);
          this.snackbarService.showSnackbar(
            `Failed to create task. Please try again.`,
            'error'
          );
        },
      });
    } else {
      // Update existing task via the service
      this.tasksService.updateTask(taskToSend).subscribe({
        next: (updatedTask) => {
          console.log(`Task updated successfully:`, updatedTask);
          // Update the task in tableData with any changes from backend
          this.tableData[row] = {
            ...updatedTask,
            assignedAgentRole: taskData.assignedAgentRole,
          };
          this.hotInstance.render();
        },
        error: (error) => {
          console.error(`Error updating task ${taskData.id}:`, error);
          this.snackbarService.showSnackbar(
            `Failed to update task ${taskData.id}. Please try again.`,
            'error'
          );
        },
      });
    }
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

    // Scroll the viewport to the newly added row
    this.hotInstance.scrollViewportTo(index, undefined);

    // Re-render the table
    this.hotInstance.render();
  }

  // Popup logic methods remain unchanged
  // ...

  ngOnDestroy(): void {
    // this.removeEditorListeners();
    // this.hidePopup();
    if (this.hotInstance) {
      this.hotInstance.destroy();
    }
    this.eventListenerRefs.forEach((cleanup) => cleanup());
    this.eventListenerRefs = [];
  }
}
