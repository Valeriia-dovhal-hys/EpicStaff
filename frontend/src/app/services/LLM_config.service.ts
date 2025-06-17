import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGetRequest } from '../shared/models/api-request.model';
import {
  LLM_Config,
  CreateLLMConfigRequest,
  UpdateLLMConfigRequest,
  GetLlmConfigRequest,
  LLMConfigDto,
} from '../shared/models/LLM_config.model';
import { ConfigService } from './config/config.service';

@Injectable({
  providedIn: 'root',
})
export class LLM_Config_Service {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'llm-configs/';
  }

  getAllConfigsLLM(): Observable<GetLlmConfigRequest[]> {
    return this.http
      .get<ApiGetRequest<GetLlmConfigRequest>>(this.apiUrl, {
        headers: this.headers,
      })
      .pipe(map((response) => response.results));
  }

  getConfigById(id: number): Observable<GetLlmConfigRequest> {
    return this.http.get<GetLlmConfigRequest>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }

  createConfig(configData: CreateLLMConfigRequest): Observable<LLM_Config> {
    return this.http.post<LLMConfigDto>(this.apiUrl, configData, {
      headers: this.headers,
    });
  }

  updateConfig(configData: UpdateLLMConfigRequest): Observable<LLM_Config> {
    return this.http.put<LLM_Config>(
      `${this.apiUrl}${configData.id}/`,
      configData,
      {
        headers: this.headers,
      }
    );
  }

  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
