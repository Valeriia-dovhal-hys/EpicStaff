import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  Task,
  CreateTaskRequest,
  GetTaskRequest,
  UpdateTaskRequest,
} from '../shared/models/task.model';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { ConfigService } from './config/config.service';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'tasks/';
  }

  // GET all tasks (limit=1000 by default)
  getTasks(): Observable<GetTaskRequest[]> {
    const url = `${this.apiUrl}?limit=1000`;
    return this.http
      .get<ApiGetRequest<GetTaskRequest>>(url)
      .pipe(map((response) => response.results));
  }

  // GET tasks filtered by project (crew) ID
  getTasksByProjectId(projectId: string): Observable<GetTaskRequest[]> {
    return this.getTasks().pipe(
      map((tasks: GetTaskRequest[]) =>
        tasks.filter((task: GetTaskRequest) => task.crew === Number(projectId))
      )
    );
  }

  // GET task by ID
  getTaskById(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}${taskId}/`);
  }

  // POST create task
  createTask(task: CreateTaskRequest): Observable<GetTaskRequest> {
    return this.http.post<GetTaskRequest>(this.apiUrl, task, {
      headers: this.headers,
    });
  }

  // PUT update task
  updateTask(task: UpdateTaskRequest): Observable<GetTaskRequest> {
    return this.http.put<GetTaskRequest>(`${this.apiUrl}${task.id}/`, task, {
      headers: this.headers,
    });
  }

  // PATCH method to update task order
  patchTaskOrder(taskId: number, order: number): Observable<GetTaskRequest> {
    return this.http.patch<GetTaskRequest>(
      `${this.apiUrl}${taskId}/`,
      { order },
      {
        headers: this.headers,
      }
    );
  }

  // DELETE task
  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${taskId}/`, {
      headers: this.headers,
    });
  }
}
