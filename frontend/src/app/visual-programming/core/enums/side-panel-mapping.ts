// side-panel-mapping.ts
import { ComponentType } from '@angular/cdk/portal';
import { NodeType } from './node-type';
import { AgentSidePanelComponent } from '../../components/side-panels/agent-panel/agent-side-panel.component';
import { LLMConfigSidePanelComponent } from '../../components/side-panels/llm-panel/llm-edit-dialog.component';
import { ToolConfigSidePanelComponent } from '../../components/side-panels/tool-panel/tool-config-edit-dialog.component';
import { TaskSidePanelComponent } from '../../components/side-panels/task-panel/task-side-panel.components';
import { ProjectSidePanelComponent } from '../../components/side-panels/project-panel/project-side-panel.component';
import { PythonSidePanelComponent } from '../../components/side-panels/python-node/python-side-panel.component';
import { ConditionalEdgeSidePanelComponent } from '../../components/side-panels/coniditonal-edge/conditional-edge-side-panel.component';

import { DecisionTableSidePanelComponent } from '../../components/side-panels/conditonal-table/decision-table-side-panel.component';

export const SIDE_PANEL_MAPPING: { [key in NodeType]?: ComponentType<any> } = {
  [NodeType.AGENT]: AgentSidePanelComponent,
  [NodeType.TASK]: TaskSidePanelComponent,
  [NodeType.LLM]: LLMConfigSidePanelComponent,
  [NodeType.TOOL]: ToolConfigSidePanelComponent,
  [NodeType.PROJECT]: ProjectSidePanelComponent,
  [NodeType.PYTHON]: PythonSidePanelComponent,
  [NodeType.EDGE]: ConditionalEdgeSidePanelComponent,
  [NodeType.TABLE]: DecisionTableSidePanelComponent,
};
