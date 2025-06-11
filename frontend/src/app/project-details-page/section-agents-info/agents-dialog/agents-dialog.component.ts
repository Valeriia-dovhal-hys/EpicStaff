import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';

import { Agent } from '../../../shared/models/agent.model';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { AgentsService } from '../../../services/staff.service';
import { Task } from '../../../shared/models/task.model';
import { UpdateAgentsConfirmationDialogComponent } from '../update-agents-confirmation-dialog.component';

@Component({
  selector: 'app-agents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  templateUrl: './agents-dialog.component.html',
  styleUrls: ['./agents-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsDialogComponent implements OnInit {
  public staffAgents: Agent[] = [];
  public isLoading: boolean = true;
  public tasks: Task[] = [];

  private initialSelectedAgents: Agent[] = [];
  public selectedAgents: Agent[] = [];

  private agentAssignedTasks: { [agentId: number]: Task[] } = {};

  constructor(
    public dialogRef: MatDialogRef<AgentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { preSelectedAgents: Agent[]; tasks?: Task[] },
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private agentsService: AgentsService
  ) {
    this.selectedAgents = data.preSelectedAgents
      ? [...data.preSelectedAgents]
      : [];
    this.initialSelectedAgents = data.preSelectedAgents
      ? [...data.preSelectedAgents]
      : [];
    this.tasks = data.tasks || [];
  }

  ngOnInit(): void {
    this.loadStaffAgents();
  }

  private loadStaffAgents(): void {
    this.isLoading = true;
    this.agentsService.getAgents().subscribe({
      next: (agents: Agent[]) => {
        this.staffAgents = agents;

        this.mapTasksToAgents();

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        console.error('Error fetching agents', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapTasksToAgents(): void {
    if (this.tasks && this.tasks.length > 0) {
      // Map tasks to agents
      this.tasks.forEach((task: Task) => {
        const agentId: number | null = task.agent;
        if (agentId) {
          if (!this.agentAssignedTasks[agentId]) {
            this.agentAssignedTasks[agentId] = [];
          }
          this.agentAssignedTasks[agentId].push(task);
        }
      });
    }
  }

  public toggleSelection(agent: Agent): void {
    const index: number = this.selectedAgents.findIndex(
      (a) => a.id === agent.id
    );
    if (index > -1) {
      this.selectedAgents.splice(index, 1);
    } else {
      this.selectedAgents.push(agent);
    }
  }

  public isSelected(agent: Agent): boolean {
    return this.selectedAgents.some(
      (selectedAgent) => selectedAgent.id === agent.id
    );
  }

  public addSelectedAgents(): void {
    if (this.tasks && this.tasks.length > 0) {
      // Check if any unselected agents have assigned tasks
      const unselectedAgents: Agent[] = this.initialSelectedAgents.filter(
        (agent) => !this.isSelected(agent)
      );

      const unselectedAgentsWithTasks: Agent[] = unselectedAgents.filter(
        (agent) => this.agentAssignedTasks[agent.id]?.length > 0
      );

      if (unselectedAgentsWithTasks.length > 0) {
        // Open confirmation dialog
        const dialogRef = this.dialog.open(
          UpdateAgentsConfirmationDialogComponent,
          {
            data: {
              agentsWithTasks: unselectedAgentsWithTasks.map((agent) => ({
                agent,
                tasks: this.agentAssignedTasks[agent.id],
              })),
            },
            width: '400px',
          }
        );

        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
          if (confirmed) {
            // Collect tasks to update (set agent to null)
            const tasksToUpdate: Task[] = [];
            unselectedAgentsWithTasks.forEach((agentWithTasks) => {
              tasksToUpdate.push(...this.agentAssignedTasks[agentWithTasks.id]);
            });

            this.dialogRef.close({
              selectedAgents: this.selectedAgents,
              tasksToUpdate,
            });
          }
        });
      } else {
        this.dialogRef.close({ selectedAgents: this.selectedAgents });
      }
    } else {
      this.dialogRef.close({ selectedAgents: this.selectedAgents });
    }
  }

  public closeDialog(): void {
    this.dialogRef.close();
  }
}
