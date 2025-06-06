import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiRequest } from '../shared/models/api-request.model';
import { Tool } from '../shared/models/tool.model';

@Injectable({
  providedIn: 'root',
})
export class ToolsService {
  private apiUrl = 'http://127.0.0.1:8000/api/tools/';

  constructor(private http: HttpClient) {}

  getTools(): Observable<Tool[]> {
    return this.http
      .get<ApiRequest<Tool>>(this.apiUrl)
      .pipe(map((response: ApiRequest<Tool>) => response.results));
  }
}
