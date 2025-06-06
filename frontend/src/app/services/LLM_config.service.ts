import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiRequest } from '../shared/models/api-request.model';
import { LLM_Config } from '../shared/models/LLM_config.model';
import { CreateLLMConfigRequest } from '../shared/models/LLM_config.model';

@Injectable({
  providedIn: 'root',
})
export class LLM_Config_Service {
  private apiUrl = 'http://127.0.0.1:8000/api/config-llm/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  getConfigLLM(): Observable<LLM_Config[]> {
    return this.http
      .get<ApiRequest<LLM_Config>>(this.apiUrl)
      .pipe(map((response: ApiRequest<LLM_Config>) => response.results));
  }

  // New method to create a config
  createConfig(configData: CreateLLMConfigRequest): Observable<LLM_Config> {
    return this.http.post<LLM_Config>(`${this.apiUrl}`, configData, {
      headers: this.headers,
    });
  }
}
