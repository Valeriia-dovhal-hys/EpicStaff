import { Component, OnInit } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog'; // Import from CDK instead of Material
import { PageHeaderComponent } from '../../shared/components/header/page-header.component';
import { FullAgent, FullAgentService } from '../../services/full-agent.service';
import { AgentDto } from '../../shared/models/agent.model';
import { CreateAgentFormComponent } from '../../shared/components/create-agent-form-dialog/create-agent-form-dialog.component';
import { AgentsTableComponent } from './components/agents-table/agents-table.component';
import { ButtonComponent } from '../../shared/components/buttons/button/button.component';
import { TabButtonComponent } from '../../shared/components/tab-button/tab-button.component';
import { FiltersListComponent } from '../../shared/components/filters-list/filters-list.component';

@Component({
  selector: 'app-staff-page',
  standalone: true,
  imports: [AgentsTableComponent, ButtonComponent, FiltersListComponent],
  templateUrl: './staff-page.component.html',
  styleUrls: ['./staff-page.component.scss'],
})
export class StaffPageComponent {
  public newlyCreatedAgent: FullAgent | null = null;

  constructor(
    private dialog: Dialog,
    private fullAgentService: FullAgentService
  ) {}

  openCreateAgentDialog(): void {
    const dialogRef = this.dialog.open<AgentDto>(CreateAgentFormComponent, {
      maxWidth: 'none',
      width: '600px',
      data: {
        toolConfigs: [],
        toolsData: [],
      },
    });

    dialogRef.closed.subscribe((result: AgentDto | undefined) => {
      if (result) {
        // Fetch the full agent using the ID from the creation result
        this.fullAgentService.getFullAgentById(result.id).subscribe({
          next: (fullAgent) => {
            if (fullAgent) {
              this.newlyCreatedAgent = fullAgent;
            } else {
              console.error(
                'Could not find newly created agent with ID:',
                result.id
              );
            }
          },
          error: (error) => {
            console.error('Error fetching newly created agent:', error);
          },
        });
      }
    });
  }
}
