import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ConfigService } from '../../../../services/config/config.service';

export interface RealtimeModelConfig {
  id: number;
  custom_name: string;
  api_key: string;
  realtime_model: number;
}

export interface ApiGetResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateRealtimeModelConfigRequest {
  api_key: string;
  realtime_model: number;
  custom_name: string;
}

export interface UpdateRealtimeModelConfigRequest {
  id: number;
  custom_name: string;
  api_key?: string;
  realtime_model: number;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeModelConfigsService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'realtime-model-configs/';
  }

  // GET all realtime model configs
  getAllConfigs(): Observable<RealtimeModelConfig[]> {
    return this.http
      .get<ApiGetResponse<RealtimeModelConfig>>(this.apiUrl, {
        headers: this.headers,
      })
      .pipe(map((response) => response.results));
  }

  // GET a realtime model config by ID
  getConfigById(id: number): Observable<RealtimeModelConfig> {
    return this.http.get<RealtimeModelConfig>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }

  // POST a new realtime model config
  createConfig(
    configData: CreateRealtimeModelConfigRequest
  ): Observable<RealtimeModelConfig> {
    return this.http.post<RealtimeModelConfig>(this.apiUrl, configData, {
      headers: this.headers,
    });
  }

  // PUT to update an existing realtime model config
  updateConfig(
    configData: UpdateRealtimeModelConfigRequest
  ): Observable<RealtimeModelConfig> {
    return this.http.put<RealtimeModelConfig>(
      `${this.apiUrl}${configData.id}/`,
      configData,
      { headers: this.headers }
    );
  }

  // DELETE a realtime model config by ID
  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
