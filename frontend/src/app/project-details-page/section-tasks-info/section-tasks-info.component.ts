import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { Task } from '../../shared/models/task.model';
import { Agent } from '../../shared/models/agent.model';
import { ProjectTasksTableComponent } from '../../handsontable-tables/project-tasks-table/project-tasks-table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-section-tasks-info',
  templateUrl: './section-tasks-info.component.html',
  styleUrls: ['./section-tasks-info.component.scss'],
  standalone: true,
  imports: [NgIf, MatButtonModule, MatIconModule, ProjectTasksTableComponent],
})
export class SectionTasksInfoComponent {
  @Input() tasks: Task[] = [];
  @Input() agents: Agent[] = [];
  @Input() projectId!: number;

  @Output() addTaskClicked = new EventEmitter<void>();

  constructor() {}

  onOpenCreateTaskDialog(): void {
    this.addTaskClicked.emit();
  }
}
