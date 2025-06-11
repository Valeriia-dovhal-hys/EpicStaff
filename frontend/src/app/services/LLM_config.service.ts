import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ApiGetRequest } from '../shared/models/api-request.model';
import {
  LLM_Config,
  CreateLLMConfigRequest,
} from '../shared/models/LLM_config.model';

@Injectable({
  providedIn: 'root',
})
export class LLM_Config_Service {
  private apiUrl = 'http://127.0.0.1:8000/api/config-llm/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  getAllConfigsLLM(): Observable<LLM_Config[]> {
    return this.http
      .get<ApiGetRequest<LLM_Config>>(`${this.apiUrl}?limit=2000`, {
        headers: this.headers,
      })
      .pipe(map((response) => response.results));
  }

  getConfigById(id: number): Observable<LLM_Config> {
    return this.http.get<LLM_Config>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }

  createConfig(configData: CreateLLMConfigRequest): Observable<LLM_Config> {
    return this.http.post<LLM_Config>(`${this.apiUrl}`, configData, {
      headers: this.headers,
    });
  }

  updateConfig(
    id: number,
    configData: CreateLLMConfigRequest
  ): Observable<LLM_Config> {
    return this.http.put<LLM_Config>(`${this.apiUrl}${id}/`, configData, {
      headers: this.headers,
    });
  }

  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
