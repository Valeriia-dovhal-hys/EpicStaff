import { Routes } from '@angular/router';

import { UserSettingsPageComponent } from './user-settings-page/user-settings-page.component';
import { ToolsComponent } from './user-settings-page/tools/tools.component';
import { ModelsComponent } from './user-settings-page/models/models.component';
import { SystemSettingsComponent } from './user-settings-page/system-settings/system-settings.component';

import { EnvironmentKeysComponent } from './user-settings-page/environment-keys/environment-keys.component';
import { StaffSettingsComponent } from './user-settings-page/staff-settings/staff-settings.component';
import { ProjectSettingsComponent } from './user-settings-page/project-settings/project-settings.component';
import { OpenProjectPageComponent } from './open-project-page/open-project-page.component';

import { ProjectGraphComponent } from './visual-programming/project-graph/project-graph.component';
import { FlowsPageComponent } from './pages/flows-page/flows-page.component';
import { FlowVisualProgrammingComponent } from './pages/flows-page/components/flow-visual-programming/flow-visual-programming.component';
import { StaffPageComponent } from './pages/staff-page/staff-page.component';
import { RunningGraphComponent } from './pages/running-graph/running-graph-page.component';
import { KnowledgeSourcesComponent } from './pages/knowledge-sources/knowledge-sources.component';
import { ChatsPageComponent } from './pages/chats-page/chats-page.component';
import { ModelsPageComponent } from './pages/models-page/models-page.component';
import { ProjectsPageComponent } from './pages/projects-page/projects-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },

  { path: 'projects', component: ProjectsPageComponent },
  {
    path: 'project/:projectId',
    component: OpenProjectPageComponent,
  },
  {
    path: 'staff',
    component: StaffPageComponent,
  },
  {
    path: 'tools',
    component: ToolsComponent,
  },
  {
    path: 'models',
    component: ModelsPageComponent,
  },
  { path: 'flows', component: FlowsPageComponent },
  {
    path: 'flows/:id',
    component: FlowVisualProgrammingComponent,
  },

  { path: 'project-nodes/:projectId', component: ProjectGraphComponent },

  {
    path: 'graph/:graphId/session/:sessionId',
    component: RunningGraphComponent,
  },

  {
    path: 'knowledge-sources',
    component: KnowledgeSourcesComponent,
  },
  {
    path: 'chats',
    component: ChatsPageComponent,
  },
  {
    path: 'settings',
    component: UserSettingsPageComponent,
    children: [
      {
        path: '',
        redirectTo: 'system',
        pathMatch: 'full',
      },

      {
        path: 'system',
        component: SystemSettingsComponent,
      },
      {
        path: 'staff',
        component: StaffSettingsComponent,
      },
      {
        path: 'project',
        component: ProjectSettingsComponent,
      },
      {
        path: 'environment-keys',
        component: EnvironmentKeysComponent,
      },
    ],
  },
  //   {
  //     path: 'staff',
  //     component: StaffComponent,
  //     canDeactivate: [UnsavedChangesGuard],
  //   },
  { path: '**', redirectTo: '' },
];
