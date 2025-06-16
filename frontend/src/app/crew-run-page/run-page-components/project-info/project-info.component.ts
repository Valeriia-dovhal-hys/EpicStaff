import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Project } from '../../../shared/models/project.model';
import { Agent } from '../../../shared/models/agent.model';
import { Task } from '../../../shared/models/task.model';
import { CommonModule, Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  RunCrewSessionService,
  Session,
} from '../../../services/run-crew-session.service';
import { ConfirmStopDialogComponent } from '../../../project-list-page/project-list-item-card/session-list-dialog/confirm-run-dialog/confirm-stop-dialog.component';

@Component({
  selector: 'app-project-info',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './project-info.component.html',
  styleUrls: ['./project-info.component.scss'],
})
export class ProjectInfoComponent implements OnInit {
  @Input() project!: Project;
  @Input() agents!: Agent[];
  @Input() tasks!: Task[];
  @Input() session!: Session; // Accept the session object

  tasksWithAgentRole: (Task & { agentRole: string })[] = [];
  agentMap: Map<number, Agent> = new Map();

  constructor(
    private location: Location,
    private dialog: MatDialog,
    private runCrewSessionService: RunCrewSessionService,
    private cdr: ChangeDetectorRef
  ) {}

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

  goBack() {
    this.location.back();
  }

  onStop(): void {
    const dialogRef = this.dialog.open(ConfirmStopDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Stop',
        message:
          "By pressing Stop, you won't be able to continue the project session.",
        confirmButtonText: 'Stop',
        cancelButtonText: 'Close',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.runCrewSessionService.stopSession(this.session.id).subscribe({
          next: () => {
            console.log(`Session ${this.session.id} successfully stopped.`);
            this.session.status = 'end';
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error(`Failed to stop session ${this.session.id}:`, error);
          },
        });
      } else {
        console.log('Session stop cancelled.');
      }
    });
  }
}
