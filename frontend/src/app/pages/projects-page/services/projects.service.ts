// src/app/services/projects.service.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ProjectDto,
  CreateProjectRequest,
  UpdateProjectRequest,
  GetProjectRequest,
} from '../models/project.model';
import { ApiGetRequest } from '../../../shared/models/api-request.model';
import { ConfigService } from '../../../services/config/config.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  // Inject ConfigService to retrieve the runtime configuration
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Create a getter that dynamically returns the API URL
  private get apiUrl(): string {
    return this.configService.apiUrl + 'crews/';
  }

  getProjects(): Observable<GetProjectRequest[]> {
    const url = this.apiUrl;
    console.log('GET projects from:', url);
    return this.http
      .get<ApiGetRequest<GetProjectRequest>>(url)
      .pipe(map((response) => response.results));
  }

  getProjectById(id: number): Observable<GetProjectRequest> {
    return this.http.get<ProjectDto>(`${this.apiUrl}${id}/`);
  }

  createProject(project: CreateProjectRequest): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(this.apiUrl, project, {
      headers: this.headers,
    });
  }

  updateProject(project: UpdateProjectRequest): Observable<ProjectDto> {
    return this.http.put<ProjectDto>(`${this.apiUrl}${project.id}/`, project, {
      headers: this.headers,
    });
  }

  patchUpdateProject(
    id: number,
    updateData: Partial<GetProjectRequest>
  ): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${id}/`, updateData, {
      headers: this.headers,
    });
  }

  updateProjectField(id: number, description: string): Observable<ProjectDto> {
    const updateData = { description };
    return this.http.patch<ProjectDto>(`${this.apiUrl}${id}/`, updateData, {
      headers: this.headers,
    });
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
