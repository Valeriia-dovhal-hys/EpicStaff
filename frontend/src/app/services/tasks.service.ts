// tasks.service.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Task, CreateTaskRequest } from '../shared/models/task.model';
import { ApiGetRequest } from '../shared/models/api-request.model';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private apiUrl = 'http://127.0.0.1:8000/api/tasks/';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  // GET all tasks

  getTasks(): Observable<Task[]> {
    return this.http
      .get<ApiGetRequest<Task>>(this.apiUrl)
      .pipe(map((response: ApiGetRequest<Task>) => response.results));
  }

  // GET task by ID
  getTaskById(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}${taskId}/`);
  }

  // POST create task
  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task, { headers: this.headers });
  }

  // PUT update task
  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}${task.id}/`, task, {
      headers: this.headers,
    });
  }

  // DELETE task
  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${taskId}/`, {
      headers: this.headers,
    });
  }
}
