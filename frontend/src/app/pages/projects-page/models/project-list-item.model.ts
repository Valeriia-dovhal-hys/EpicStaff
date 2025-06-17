import { GetProjectRequest } from '../../../features/projects/models/project.model';

export interface ProjectListItem extends GetProjectRequest {
  favorite: boolean;
  labels: string[];
}
