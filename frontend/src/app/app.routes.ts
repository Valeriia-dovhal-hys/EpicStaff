import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';

import { UnsavedChangesGuard } from './shared/guards/unsaved-changes.guard';

import { ProjectsListComponent } from './project-list-page/projects-list.component';
import { ProjectDetailsComponent } from './project-details-page/project-details.component';
import { TesttableComponent } from './main/testtable/testtable.component';
import { VariablesComponent } from './main/variables/variables.component';
import { TestTableDataComponent } from './main/test-table-data/test-table-data.component';
import { TasksTable2Component } from './handsontable-tables/tasks-template/tasks-table-2.component';
import { StaffComponent } from './handsontable-tables/staff/staff.component';
import { CrewRunPageComponent } from './crew-run-page/crew-run-page.component';

export const routes: Routes = [
  {
    path: '',
    component: ProjectsListComponent,
    pathMatch: 'full',
  },

  { path: 'projects-list', component: ProjectsListComponent },
  {
    path: 'project/:projectId',
    component: ProjectDetailsComponent,
  },
  {
    path: 'project/:projectId/run-session/:sessionId',
    component: CrewRunPageComponent,
  },
  // {
  //   path: 'settings',
  // },
  {
    path: 'test-table-dialog',
    component: TesttableComponent,
  },
  // {
  //   path: 'test-table-data',
  //   component: TestTableDataComponent,
  // },

  {
    path: 'popup',
    component: VariablesComponent,
  },
  {
    path: 'tasks-templates',
    component: TasksTable2Component,
  },
  {
    path: 'staff',
    component: StaffComponent,
    canDeactivate: [UnsavedChangesGuard],
  },
  { path: '**', redirectTo: '' },
];
