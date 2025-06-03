// tasks-table-2.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ViewEncapsulation,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import Handsontable from 'handsontable';

import { TasksService } from '../../services/tasks.service';
import { Task } from '../../shared/models/task.model';
import { CommonModule } from '@angular/common';

import {
  ChangeTask,
  ChangeSource,
} from '../table-utils/universal_handsontable_utils';
import { Agent, getAgentsRequest } from '../../shared/models/agent.model';
import { AgentsService } from '../../services/staff.service';
import { forkJoin, fromEvent, Subscription } from 'rxjs';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';

//validators
import { validateNotEmpty } from '../table-utils/column-validators/validate-not-empty-validator';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-tasks-table-2',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './tasks-table-2.component.html',
  styleUrls: ['./tasks-table-2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TasksTable2Component implements OnInit, OnDestroy {
  @ViewChild('allTasksTableContainer', { static: false })
  hotContainer!: ElementRef;
  private hotInstance!: Handsontable.Core;

  columns!: Handsontable.ColumnSettings[];
  hotSettings!: Handsontable.GridSettings;

  tasksTableData: Task[] = [];
  agentsData: Agent[] = []; // Store agents

  // Loading state
  isLoading: boolean = true;

  private subscriptions: Subscription = new Subscription();

  colHeaders: string[] = [
    // 'Project Name',
    'Title',
    'Instructions',
    'Expected Output',
    // 'Order',
    // 'Assigned To',
  ];

  constructor(
    private tasksService: TasksService,
    private agentsService: AgentsService,
    private cdr: ChangeDetectorRef,
    private snackbarService: SharedSnackbarService
  ) {
    this.columns = [
      // {
      //   data: 'project_name',
      //   type: 'text',
      //   validator: validateNotEmpty(this.snackbarService),
      // },
      {
        data: 'title',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
      },
      {
        data: 'instructions',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
      },
      {
        data: 'expectedOutput',
        type: 'text',
        validator: validateNotEmpty(this.snackbarService),
      },
      // {
      //   data: 'order',
      //   type: 'numeric',
      // },
      // {
      //   data: 'assignedAgentRole',
      //   readOnly: true,
      //   // type: 'dropdown',
      //   // source: [],
      // },
    ];

    this.hotSettings = {
      stretchH: 'all',
      width: '100%',
      height: '100%',
      colWidths: [100, 150, 300, 300, 100, 150],
      colHeaders: this.colHeaders,
      columns: this.columns,

      //optimization

      autoRowSize: true,
      autoColumnSize: true,
      renderAllRows: false,
      manualColumnResize: true,
      manualRowResize: true,
      outsideClickDeselects: true,
      autoWrapRow: false,
      autoWrapCol: false,
      minSpareRows: 0,
      // end optimization
      // dataSchema: {
      //   id: '',
      //   project_name: '',
      //   title: '',
      //   instructions: '',
      //   expectedOutput: 'null',
      //   order: 1,
      //   assignedAgentRole: 'Not Assigned',
      //   asyncExecution: false,
      // },

      rowHeaders: true,
      rowHeights: 125,

      // autoRowSize: true,
      wordWrap: true,
      licenseKey: 'non-commercial-and-evaluation',

      afterCreateRow: this.afterCreateRowHandler.bind(this),
      afterChange: this.afterChangeHandler.bind(this),
      contextMenu: {
        items: {
          remove_row: {
            name: 'Remove row',
          },
        },
      },
    };
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
  ngOnInit(): void {
    // this.fetchTasksAndAgents();
  }

  // private fetchTasksAndAgents(): void {
  //   this.isLoading = true;
  //   const forkJoinSubscription = forkJoin({
  //     tasks: this.tasksService.getTasks(),
  //     agents: this.agentsService.getAgents(),
  //   }).subscribe({
  //     next: ({ tasks, agents }: { tasks: TaskGetResponse[]; agents: any }) => {
  //       // Process agents
  //       this.agentsData = agents;

  //       // Process tasks and map assigned agent roles
  //       this.tasksTableData = tasks.map((task) => ({
  //         ...task,
  //         assignedAgentRole: task.agent?.role
  //           ? task.agent.role
  //           : 'Not Assigned',
  //       }));

  //       // Update the source for the dropdown options
  //       const uniqueAgentRoles = Array.from(
  //         new Set(agents.map((agent: { role: any }) => agent.role))
  //       );

  //       uniqueAgentRoles.push('Not Assigned');
  //       this.updateAssignedToColumnSource(uniqueAgentRoles);

  //       this.tasksTableData.push(this.createEmptyTask());
  //       this.isLoading = false;

  //       this.cdr.detectChanges(); // Trigger change detection

  //       this.initializeHandsontable();
  //     },
  //     error: (error) => {
  //       console.error('Error fetching tasks or agents:', error);
  //       this.isLoading = false;
  //       this.cdr.detectChanges();
  //     },
  //   });

  //   this.subscriptions.add(forkJoinSubscription);
  // }

  // private createEmptyTask(): Task {
  //   return {
  //     id: '',
  //     project_name: '',
  //     title: '',
  //     instructions: '',
  //     expectedOutput: '',
  //     order: 1,
  //     assignedAgentRole: 'Not Assigned',
  //     asyncExecution: false,
  //   };
  // }

  private updateAssignedToColumnSource(agentRoles: string[]): void {
    if (Array.isArray(this.hotSettings.columns)) {
      const assignedToColumn = this.hotSettings.columns.find(
        (col) => col.data === 'assignedAgentRole'
      );
      if (assignedToColumn) {
        assignedToColumn.source = agentRoles;
      } else {
        console.warn("Column with data 'assignedAgentRole' not found.");
      }
    } else {
      console.warn('Columns are not defined as an array.');
    }
  }

  private initializeHandsontable(): void {
    if (this.hotContainer && this.hotContainer.nativeElement) {
      this.hotInstance = new Handsontable(this.hotContainer.nativeElement, {
        ...this.hotSettings,
        data: this.tasksTableData,
      });
    } else {
      console.error('Container element not found!');
    }
  }

  // flags for afterChange
  private lastModifiedRow: number | null = null;
  private assignedToAgentRoleChanged: boolean = false;

  private afterChangeHandler(
    changes: ChangeTask[] | null,
    source: ChangeSource
  ): void {
    if (!changes || !(source === 'edit' || source === 'CopyPaste.paste')) {
      return;
    }

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue === newValue) return;

      // Check for new RowIndex
      if (this.lastModifiedRow !== null && this.lastModifiedRow !== row) {
        // Send update for the previous rowIndex
        this.sendRowUpdate(this.lastModifiedRow);

        // Reset the flag and row tracker
        this.lastModifiedRow = null;
        this.assignedToAgentRoleChanged = false;
      }

      // Update the tracker for the current row
      this.lastModifiedRow = row;

      if (prop === 'assignedAgentRole') {
        this.assignedToAgentRoleChanged = true;
      }
    });

    // Ensure last modified row is updated
    setTimeout(() => {
      if (this.lastModifiedRow !== null) {
        this.sendRowUpdate(this.lastModifiedRow);

        // Resetting flags
        this.lastModifiedRow = null;
        this.assignedToAgentRoleChanged = false;
      }
    }, 0);
  }

  private sendRowUpdate(row: number): void {
    const task: Task = this.hotInstance.getSourceDataAtRow(row) as Task;

    // if (this.assignedToAgentRoleChanged) {
    //   const selectedAgent: Agent | undefined = this.agentsData.find(
    //     (agent) => agent.role === task.assignedAgentRole
    //   );
    //   console.log(selectedAgent);

    //   if (selectedAgent) {
    //     task.assignedAgentId = selectedAgent.id;
    //     task.agent = selectedAgent; // Optional, if needed by backend
    //   } else {
    //     task.assignedAgentId = undefined;
    //     task.agent = undefined;
    //   }
    // }

    this.tasksService.updateTask(task).subscribe({
      next: () => {
        console.log('Task updated successfully.', task);
        // this.snackbarService.showSnackbar(
        //   // `Task ${task.title} updated successfully.`,
        //   'success'
        // );
      },
      error: (error) => {
        console.error(`Error updating task ${task.id}:`, error);
      },
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.unsubscribe();

    if (this.hotInstance) {
      this.hotInstance.destroy();
    }
  }
}
