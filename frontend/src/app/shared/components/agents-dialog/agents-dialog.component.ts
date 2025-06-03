import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';

import { Agent } from '../../models/agent.model';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AgentsService } from '../../../services/staff.service';

@Component({
  selector: 'app-agents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDialogModule,
  ],
  templateUrl: './agents-dialog.component.html',
  styleUrls: ['./agents-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsDialogComponent implements OnInit {
  agents: Agent[] = [];

  isLoading: boolean = true;

  selectedAgents: Set<Agent> = new Set();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { selectedAgentIds: number[] },
    private agentsService: AgentsService,
    private dialogRef: MatDialogRef<AgentsDialogComponent>,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading = true;
    this.agentsService.getAgents().subscribe({
      next: (data: any) => {
        this.agents = data;

        this.data.selectedAgentIds.forEach((id) => {
          const agent: Agent | undefined = this.agents.find(
            (agent) => agent.id === id
          );
          if (agent) {
            this.selectedAgents.add(agent);
          }
        });

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

  toggleSelection(agent: Agent): void {
    if (this.isSelected(agent)) {
      this.selectedAgents.delete(agent);
    } else {
      this.selectedAgents.add(agent);
    }
  }

  isSelected(agent: Agent): boolean {
    return this.selectedAgents.has(agent);
  }

  addSelectedAgents(): void {
    const selectedAgentsArray = Array.from(this.selectedAgents);
    console.log('Selected agents:', selectedAgentsArray);

    this.dialogRef.close(selectedAgentsArray);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
