import { GetProjectRequest } from './project.model';

export interface ProjectListItem extends GetProjectRequest {
  favorite: boolean;
  labels: string[];
}
