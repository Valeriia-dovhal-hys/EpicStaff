import { Tool } from '../../../shared/models/tool.model';

export interface ToolCard extends Tool {
  label?: string;
  favorite?: boolean;
}
