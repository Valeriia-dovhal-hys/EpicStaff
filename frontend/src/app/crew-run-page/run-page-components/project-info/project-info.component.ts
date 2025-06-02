import { Component, Input, OnInit } from '@angular/core';
import { Project } from '../../../shared/models/project.model';
import { Agent } from '../../../shared/models/agent.model';
import { Task } from '../../../shared/models/task.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-info.component.html',
  styleUrls: ['./project-info.component.scss'],
})
export class ProjectInfoComponent implements OnInit {
  @Input() project!: Project;
  @Input() agents!: Agent[];
  @Input() tasks!: Task[];

  tasksWithAgentRole: (Task & { agentRole: string })[] = [];
  agentMap: Map<number, Agent> = new Map();

  ngOnInit() {
    this.createAgentMap();
    this.processTasks();
  }

  createAgentMap() {
    this.agentMap = new Map(this.agents.map((agent) => [agent.id, agent]));
  }

  processTasks() {
    this.tasksWithAgentRole = this.tasks.map((task) => {
      const agent = task.agent ? this.agentMap.get(task.agent) : null;
      return {
        ...task,
        agentRole: agent ? agent.role : 'Unassigned',
      };
    });
  }
}
