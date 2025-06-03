import {
  Component,
  AfterViewInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import Handsontable from 'handsontable';
import { manualRowResizeRenderer } from '../handsontable-tables/table-utils/cell-renderers/manual-row-resize-renderer.ts/row-resize-renderer';
import { ProjectTasksTableComponent } from '../handsontable-tables/project-tasks-table/project-tasks-table.component';
import { VariablesComponent } from './variables/variables.component';
import { forkJoin, Observable } from 'rxjs';
import { Task } from '../shared/models/task.model';
import { Agent } from '../shared/models/agent.model';
import { TasksService } from '../services/tasks.service';
import { AgentsService } from '../services/staff.service';

interface Variable {
  title: string;
  value: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [ProjectTasksTableComponent, VariablesComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent {
  // private hotInstance!: Handsontable.Core;
  // ngAfterViewInit() {
  //   const container = document.getElementById('hot');
  //   if (container) {
  //     this.hotInstance = new Handsontable(container, {
  //       autoRowSize: true,
  //       manualRowResize: true,
  //       manualColumnResize: true,
  //       data: [
  //         [
  //           'A1',
  //           'B1',
  //           'This is a long text that should be truncated when the row height is decreased.',
  //         ],
  //         ['A2', 'B2', 'Another long text for testing purposes.'],
  //         [
  //           'A1',
  //           'B1',
  //           'This is a long text that should be truncated when the row height is decreased.',
  //         ],
  //         [
  //           'A1',
  //           'B1',
  //           'This is a long text that should be truncated when the row height is decreased.',
  //         ],
  //         [
  //           'A1',
  //           'B1',
  //           'This is a long text that should be truncated when the row height is decreased.',
  //         ],
  //         [
  //           'A1',
  //           'B1',
  //           'This is a long text that should be truncated when the row height is decreased.',
  //         ],
  //         [
  //           'A1',
  //           'B1',
  //           'This is a long text that should be truncated when the row height is decreased.',
  //         ],
  //       ],
  //       colHeaders: ['Column1', 'Column2', 'TargetColumn'],
  //       columns: [
  //         { width: 100, renderer: manualRowResizeRenderer },
  //         { width: 150, renderer: manualRowResizeRenderer },
  //         { width: 200, renderer: manualRowResizeRenderer },
  //       ],
  //       rowHeaders: true,
  //       stretchH: 'all',
  //       height: 400,
  //       rowHeights: 100,
  //       licenseKey: 'non-commercial-and-evaluation',
  //     });
  //     // this.hotInstance.render();
  //   } else {
  //     console.error('Container element not found!');
  //   }
  // }
  variables: Variable[] = [
    {
      title: 'Variable1Variable1Variable1Variable1',
      value: 'Value1Value1Value1Value1Value1Value1Value1',
    },
    { title: 'Variable2', value: 'Value2' },
    { title: 'Variable3', value: 'Value3' },
  ];
  updateVariables() {
    this.variables = [
      { title: 'UpdatedVariable1', value: 'NewValue1' },
      { title: 'UpdatedVariable2', value: 'NewValue2' },
    ];
  }
  // Method to clear variables
  clearVariables() {
    this.variables = [];
  }

  @ViewChild(ProjectTasksTableComponent)
  projectTasksTableComponent!: ProjectTasksTableComponent;

  public canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.projectTasksTableComponent) {
      // return this.projectTasksTableComponent.canDeactivate();
    }
    return true; // or false, depending on your desired behavior
  }

  constructor(
    private tasksService: TasksService,
    private agentsService: AgentsService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit() {
    // Fetch tasks and agents asynchronously
    this.fetchData();
  }

  tasks: Task[] = [];
  agents: any[] = [];
  private fetchData() {
    forkJoin({
      tasks: this.tasksService.getTasks(),
      agents: this.agentsService.getAgents(),
    }).subscribe({
      next: ({ tasks, agents }) => {
        this.tasks = tasks;
        this.agents = agents.results;
        this.cdr.detectChanges();
        console.log(this.tasks);
      },
      error: (error) => {
        console.error('Error fetching tasks or agents:', error);
      },
    });
  }
}
