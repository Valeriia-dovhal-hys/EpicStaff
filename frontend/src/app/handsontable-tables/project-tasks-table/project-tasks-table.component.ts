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
  EventEmitter,
  Output,
} from '@angular/core';
import Handsontable from 'handsontable/base';
import { Task, TaskTableItem } from '../../shared/models/task.model';
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
import { catchError, from, map, mergeMap, Observable, of, toArray } from 'rxjs';
import { TasksService } from '../../services/tasks.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { mutual_Variables_RowResize_Renderer } from '../table-utils/cell-renderers/variables-cell-renderer/mutual_variables-manualresize-renderer-utility';
import { createAssignedAgentRoleRenderer } from './agentRolesRenderer';
import { VariablePopupComponent } from '../../main/variables/popup/popup.component';
import { manualRowResizeRenderer } from '../table-utils/cell-renderers/manual-row-resize-renderer.ts/row-resize-renderer';
import { validateIsNumberField } from '../table-utils/column-validators/validate-is-number';
import { createBeforeChangeHandler } from './before-change-tasks-table-handler';

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
  @Input() tasks: Task[] = [];
  @Input() agents: Agent[] = [];
  @Input() projectId!: number;

  private tableData: TaskTableItem[] = [];
  private agentRoles: string[] = [];

  private hotInstance!: Handsontable.Core;
  private hotSettings!: Handsontable.GridSettings;
  private columns!: Handsontable.ColumnSettings[];

  private colHeaders: string[] = [
    'ID',
    'projectID',
    'Name',
    'Instructions',
    'Expected Output',
    'Order',
    'Assigned To',
  ];

  private assignedAgentRoleRenderer: any;
  private eventListenerRefs: Array<() => void> = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private snackbarService: SharedSnackbarService,
    private tasksService: TasksService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tasks'] || changes['agents']) {
      this.processData();
      if (this.hotInstance) {
        this.hotInstance.loadData(this.tableData);
        this.hotInstance.updateSettings({
          columns: this.columns,
        });
        this.hotInstance.render();
      } else {
        this.initializeHandsontable();
      }
    }
  }

  ngAfterViewInit() {
    if (!this.hotInstance) {
      this.initializeHandsontable();
    }
  }

  private processData(): void {
    //sort by id
    this.tasks.sort((a: Task, b: Task) => a.id - b.id);

    this.tableData = this.tasks.map((task: Task) => {
      const agent: Agent | undefined = this.agents.find(
        (a) => a.id === task.agent
      );
      const assignedAgentRole: string = agent ? agent.role : 'Not Assigned';

      return {
        ...task,
        assignedAgentRole,
      } as TaskTableItem;
    });

    this.tableData.push(this.createEmptyTask());

    this.agentRoles = Array.from(
      new Set(this.agents.map((agent) => agent.role))
    );
    this.agentRoles.push('Not Assigned');

    this.assignedAgentRoleRenderer = createAssignedAgentRoleRenderer(
      this.agentRoles,
      this.eventListenerRefs
    );

    this.columns = [
      {
        data: 'id',
        readOnly: true,
      },
      { data: 'crew', readOnly: true },
      {
        data: 'name',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
        renderer: manualRowResizeRenderer,
        headerClassName: 'htLeft',
      },
      {
        data: 'instructions',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
        renderer: manualRowResizeRenderer,
        headerClassName: 'htLeft',
      },
      {
        data: 'expected_output',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
        renderer: manualRowResizeRenderer,
        headerClassName: 'htLeft',
      },
      {
        data: 'order',
        type: 'numeric',
        validator: validateIsNumberField(this.snackbarService),
        headerClassName: 'htLeft',
        className: 'htBottom',
      },
      {
        data: 'assignedAgentRole',
        renderer: this.assignedAgentRoleRenderer,
        editor: false,
        readOnly: false,
        headerClassName: 'htLeft',
      },
    ];
  }

  private initializeHandsontable(): void {
    if (this.hotContainer && this.hotContainer.nativeElement) {
      if (this.hotInstance) {
        this.hotInstance.destroy();
      }

      this.hotSettings = {
        stretchH: 'all',
        width: '100%',
        height: '100%',

        data: this.tableData,

        columns: this.columns,
        colHeaders: this.colHeaders,
        colWidths: [0, 0, 100, 200, 300, 40, 150],

        rowHeaders: true,
        rowHeights: 80,
        wordWrap: true,

        selectionMode: 'range',
        fillHandle: false,
        //undoredo
        undo: true,

        hiddenColumns: {
          columns: [0, 1], // Index of the column
          indicators: false,
        },

        autoRowSize: false,
        autoColumnSize: false,
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
          crew: this.projectId,
          name: '',
          instructions: '',
          expected_output: '',
          order: 0,
          agent: null,
          assignedAgentRole: 'Not Assigned',
        },

        beforeChange: createBeforeChangeHandler(this.snackbarService),

        licenseKey: 'non-commercial-and-evaluation',
        contextMenu: {
          items: {
            row_above: { name: 'Insert row above' },
            row_below: { name: 'Insert row below' },
            remove_row: {
              name: 'Delete task(s)',
              callback: (key, selection, clickEvent) => {
                this.handleDeleteRows(selection);
              },
            },
          },
        },
        afterGetRowHeader: (row: number, TH: HTMLTableCellElement) => {
          TH.classList.add('project-tasks-table-row-header-class');
        },
        afterCreateRow: this.afterCreateRowHandler.bind(this),
        afterChange: this.afterChangeHandler.bind(this),
      };

      this.hotInstance = new Handsontable(
        this.hotContainer.nativeElement,
        this.hotSettings
      );
      this.hotInstance.render();
    }
  }

  private handleDeleteRows(
    selection: Array<{
      start: Handsontable.CellCoords;
      end: Handsontable.CellCoords;
    }>
  ): void {
    const physicalRowsToDeleteSet = new Set<number>();
    const taskIdsToDeleteSet = new Set<number>();

    // Collect unique physical rows and task IDs to delete
    selection.forEach(({ start, end }) => {
      const startRow = Math.min(start.row, end.row);
      const endRow = Math.max(start.row, end.row);

      for (let visualRow = startRow; visualRow <= endRow; visualRow++) {
        const physicalRow = this.hotInstance.toPhysicalRow(visualRow);
        physicalRowsToDeleteSet.add(physicalRow);

        const task = this.tableData[physicalRow] as TaskTableItem;
        if (task?.id) {
          taskIdsToDeleteSet.add(task.id);
        }
      }
    });

    const physicalRowsToDelete = Array.from(physicalRowsToDeleteSet).sort(
      (a, b) => b - a
    ); // Sort descending
    const taskIdsToDelete = Array.from(taskIdsToDeleteSet);

    if (taskIdsToDelete.length > 0) {
      from(taskIdsToDelete)
        .pipe(
          mergeMap(
            (taskId) =>
              this.tasksService.deleteTask(taskId).pipe(
                map(() => ({ taskId, success: true })),
                catchError((error) => {
                  console.error(`Error deleting task ${taskId}:`, error);
                  return of({ taskId, success: false });
                })
              ),
            100 // Concurrent deletions limit (adjust as needed)
          ),
          toArray() // Collect all results
        )
        .subscribe({
          next: (results) => {
            const failedDeletions = results
              .filter((result) => !result.success)
              .map((r) => r.taskId);

            const successfulDeletions = results
              .filter((result) => result.success)
              .map((r) => r.taskId);

            if (failedDeletions.length > 0) {
              this.snackbarService.showSnackbar(
                `Failed to delete some tasks. Please try again.`,
                'error'
              );
            } else {
              this.snackbarService.showSnackbar(
                `Selected task(s) deleted successfully.`,
                'success'
              );
            }

            // Remove the tasks from the tasks array
            successfulDeletions.forEach((taskId) => {
              const index = this.tasks.findIndex((task) => task.id === taskId);
              if (index !== -1) {
                this.tasks.splice(index, 1);
              }
            });

            // Remove all selected physical rows from tableData
            physicalRowsToDelete.forEach((physicalRowIndex) => {
              this.tableData.splice(physicalRowIndex, 1);
            });

            // Update the grid with the new data
            this.hotInstance.loadData(this.tableData);

            // Re-render the Handsontable grid
            this.hotInstance.render();
          },
          error: (error) => {
            console.error('Error deleting tasks:', error);
            this.snackbarService.showSnackbar(
              `Failed to delete tasks. Please try again.`,
              'error'
            );

            // Re-render the Handsontable grid in case of error
            this.hotInstance.render();
          },
        });
    } else {
      // No tasks to delete from server, remove unsaved rows
      physicalRowsToDelete.forEach((physicalRowIndex) => {
        this.tableData.splice(physicalRowIndex, 1);
      });

      this.snackbarService.showSnackbar(
        `Selected row(s) deleted successfully.`,
        'success'
      );

      // Update the grid with the new data
      this.hotInstance.loadData(this.tableData);

      // Re-render the Handsontable grid
      this.hotInstance.render();
    }
  }
  private createEmptyTask() {
    return {
      id: null,
      crew: this.projectId,
      name: '',
      instructions: '',
      expected_output: '',
      order: 0,
      agent: null,
      assignedAgentRole: 'Not Assigned',
    };
  }

  private afterChangeHandler(changes: any, source: string): void {
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
    const taskData: TaskTableItem = this.hotInstance.getSourceDataAtRow(
      rowIndex
    ) as TaskTableItem;

    // STEP 1: Check if row is valid
    const isRowValidResult: boolean = isRowValid(rowIndex, this.hotInstance);
    if (!isRowValidResult) {
      console.log(`Row ${rowIndex} contains invalid data. Skipping update.`);
      return;
    }

    // STEP 2: Check if all required fields are filled
    if (!taskData.id) {
      if (!this.allRequiredFieldsFilled(taskData)) {
        console.log(
          `Row ${rowIndex} does not have all required fields filled. Skipping update.`
        );
        return;
      }
    }

    // STEP 3: Prepare the task data to send
    const taskToSend: any = { ...taskData };

    if (taskData.assignedAgentRole) {
      const agent = this.agents.find(
        (a) => a.role === taskData.assignedAgentRole
      );
      if (agent) {
        taskToSend.agent = agent.id;
      } else if (taskData.assignedAgentRole === 'Not Assigned') {
        taskToSend.agent = null;
      } else {
        window.alert(
          'You tried to assign a task to not existing in this project agent'
        );
      }
    }

    delete (taskToSend as any).assignedAgentRole;

    taskToSend.crew = this.projectId;

    if (!taskData.id) {
      this.tasksService.createTask(taskToSend).subscribe({
        next: (createdTask: Task) => {
          console.log(`Task created successfully:`, createdTask);

          this.tableData[rowIndex].id = createdTask.id;

          this.insertRowAtTheEnd();

          this.snackbarService.showSnackbar(
            `Task created successfully.`,
            'success'
          );

          this.tasks.push(createdTask);
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
      this.tasksService.updateTask(taskToSend).subscribe({
        next: (updatedTask: Task) => {
          console.log(`Task updated successfully:`, updatedTask);

          this.snackbarService.showSnackbar(
            `Task updated successfully.`,
            'success'
          );

          const taskIndex = this.tasks.findIndex(
            (task) => task.id === updatedTask.id
          );
          if (taskIndex !== -1) {
            // Update the task at the found index with the new task data
            this.tasks[taskIndex] = updatedTask;
          } else {
            console.warn('Task not found in tasks array:', updatedTask);
          }
        },
        error: (error) => {
          console.error(`Error updating task:`, error);
          this.snackbarService.showSnackbar(
            `Failed to update task. Please try again.`,
            'error'
          );
        },
      });
    }
  }

  private allRequiredFieldsFilled(taskData: TaskTableItem): boolean {
    if (!taskData) {
      return false;
    }
    const nameFilled = taskData.name != null && taskData.name.trim() !== '';
    const instructionsFilled =
      taskData.instructions != null && taskData.instructions.trim() !== '';
    const expectedOutputFilled =
      taskData.expected_output != null &&
      taskData.expected_output.trim() !== '';

    return nameFilled && instructionsFilled && expectedOutputFilled;
  }

  private insertRowAtTheEnd(): void {
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
    ) as TaskTableItem;

    // Check if the last row is empty (no id and required fields are empty)
    return !lastRowData.id && !this.allRequiredFieldsFilled(lastRowData);
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
      this.hotInstance.selectCell(index, 2);
    }, 0);

    this.hotInstance.render();
  }

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
