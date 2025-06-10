// src/app/services/projects.service.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Import the map operator
import { Project, CreateProjectRequest } from '../shared/models/project.model';
import { ApiGetRequest } from '../shared/models/api-request.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private apiUrl = 'http://127.0.0.1:8000/api/crews/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  // GET all projects
  getProjects(): Observable<Project[]> {
    return this.http
      .get<ApiGetRequest<Project>>(this.apiUrl)
      .pipe(map((response: ApiGetRequest<Project>) => response.results));
  }

  // GET project by ID
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}${id}/`);
  }

  // POST create project
  createProject(project: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project, {
      headers: this.headers,
    });
  }

  // PUT update project
  updateProject(project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}${project.id}/`, project, {
      headers: this.headers,
    });
  }

  // DELETE project
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
