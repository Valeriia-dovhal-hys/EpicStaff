import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, GetTasksRequest } from '../shared/models/task.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private apiUrl = 'http://127.0.0.1:8000/api/tasks';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  // GET all tasks
  getTasks(): Observable<Task[]> {
    return this.http
      .get<GetTasksRequest>(this.apiUrl)
      .pipe(map((response) => response.results));
  }

  // GET task by ID
  getTaskById(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${taskId}`);
  }

  // POST create a new task
  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/`, task, {
      headers: this.headers,
    });
  }

  // PUT update an existing task
  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${task.id}/`, task, {
      headers: this.headers,
    });
  }

  // DELETE a task
  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/`, {
      headers: this.headers,
    });
  }
}
