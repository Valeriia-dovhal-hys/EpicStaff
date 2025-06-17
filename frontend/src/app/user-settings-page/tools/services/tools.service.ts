import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGetRequest } from '../../../shared/models/api-request.model';
import { Tool } from '../../../shared/models/tool.model';
import { ConfigService } from '../../../services/config/config.service';

@Injectable({
  providedIn: 'root',
})
export class ToolsService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'tools/';
  }

  getTools(): Observable<Tool[]> {
    return this.http
      .get<ApiGetRequest<Tool>>(this.apiUrl)
      .pipe(map((response) => response.results));
  }

  getToolsByIds(toolIds: number[]): Observable<Tool[]> {
    const requests: Observable<Tool>[] = toolIds.map((id) =>
      this.http.get<Tool>(`${this.apiUrl}${id}/`)
    );
    return forkJoin(requests);
  }

  updateTool(tool: Tool): Observable<Tool> {
    return this.http.put<Tool>(`${this.apiUrl}${tool.id}/`, tool, {
      headers: this.headers,
    });
  }

  patchTool(toolId: number, updates: Partial<Tool>): Observable<Tool> {
    return this.http.patch<Tool>(`${this.apiUrl}${toolId}/`, updates, {
      headers: this.headers,
    });
  }
}
