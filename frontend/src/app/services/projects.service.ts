import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getProjectsRequest, Project } from '../shared/models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private apiUrl: string = 'http://127.0.0.1:8000/api/crews';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  // GET: fetch all projects
  getProjects(): Observable<getProjectsRequest> {
    return this.http.get<getProjectsRequest>(this.apiUrl);
  }

  // GET: fetch a project by ID
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}/`);
  }

  // POST: create a new project
  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/`, project, {
      headers: this.headers,
    });
  }

  // PUT: update an existing project
  updateProject(project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${project.id}`, project, {
      headers: this.headers,
    });
  }

  // DELETE: delete a project by ID
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
