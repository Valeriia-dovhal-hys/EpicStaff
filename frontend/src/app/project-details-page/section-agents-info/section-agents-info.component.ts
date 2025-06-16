import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Agent } from '../../shared/models/agent.model';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AgentItemComponent } from './agent-item/agent-item.component';

@Component({
  selector: 'app-section-agents-info',
  templateUrl: './section-agents-info.component.html',
  styleUrls: ['./section-agents-info.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, MatButtonModule, AgentItemComponent],
})
export class SectionAgentsInfoComponent {
  @Input() agents: Agent[] = [];
  @Output() addAgentsClicked = new EventEmitter<void>();
  @Output() agentRemoved = new EventEmitter<Agent>();

  public onAddAgentsClick(): void {
    this.addAgentsClicked.emit();
  }

  public onAgentRemoved(agent: Agent): void {
    this.agentRemoved.emit(agent);
  }
}
