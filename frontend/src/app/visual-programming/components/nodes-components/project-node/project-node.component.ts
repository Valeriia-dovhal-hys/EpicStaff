import { Component, Input, signal } from '@angular/core';

import { KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { GetProjectRequest } from '../../../../pages/projects-page/models/project.model';
import { ProjectNodeModel } from '../../../core/models/node.model';

@Component({
  selector: 'app-project-node',
  imports: [],
  standalone: true,
  templateUrl: './project-node.component.html',
  styleUrl: './project-node.component.scss',
})
export class ProjectNodeComponent {
  @Input() node!: ProjectNodeModel;

  // Receive the parent's expanded signal to control the display of details.
  //   @Input() parentExpanded = signal(false);
}
