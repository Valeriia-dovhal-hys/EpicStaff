import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { Task } from '../../shared/models/task.model';
import { Agent } from '../../shared/models/agent.model';
import { NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface AgentWithTasks {
  agent: Agent;
  tasks: Task[];
}

@Component({
  selector: 'app-update-agents-confirmation-dialog',
  template: `
    <h1 mat-dialog-title>Confirm Unassignment</h1>
    <div mat-dialog-content>
      <p class="message">
        The following agents have assigned tasks but are being unselected:
      </p>
      <ul class="agent-list">
        <li *ngFor="let item of data.agentsWithTasks" class="agent-item">
          <span class="agent-role">
            Agent: <span class="agent-name">{{ item.agent.role }}</span>
          </span>
          <span class="task-names">
            Task(s):
            <span class="task-name">{{ getTaskNames(item.tasks) }}</span>
          </span>
        </li>
      </ul>
      <p class="warning">
        Do you want to proceed? Their tasks will become unassigned.
      </p>
    </div>
    <div mat-dialog-actions>
      <button mat-stroked-button (click)="dialogRef.close(false)">
        Cancel
      </button>
      <button mat-flat-button color="primary" (click)="dialogRef.close(true)">
        Proceed
      </button>
    </div>
  `,
  standalone: true,
  imports: [NgFor, MatButtonModule, MatDialogModule],
  styles: [
    `
      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }

      div[mat-dialog-content] {
        font-size: 16px;
      }

      .message,
      .warning {
        margin-bottom: 16px;
      }

      .agent-list {
        margin: 0 0 16px 0;
      }

      .agent-item {
        margin-bottom: 16px;
        font-size: 15px;
        max-width: 100%;
        display: flex;
        flex-direction: column;
      }

      .agent-role,
      .task-names {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .agent-name {
        font-weight: 500;
        color: #000;
      }

      .task-name {
        color: #3f51b5;
      }

      div[mat-dialog-actions] {
        display: flex;
        justify-content: space-between;
        padding: 8px 24px;
        padding-bottom: 20px;
      }

      div[mat-dialog-actions] button + button {
        margin-left: 8px;
      }
    `,
  ],
})
export class UpdateAgentsConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UpdateAgentsConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { agentsWithTasks: AgentWithTasks[] }
  ) {
    console.log(this.data.agentsWithTasks);
  }

  getTaskNames(tasks: Task[]): string {
    return tasks.map((task) => task.name).join(', ');
  }
}
