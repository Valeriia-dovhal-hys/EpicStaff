import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiGetRequest } from '../shared/models/api-request.model';

import { ConfigService } from './config/config.service';
import {
  CreateTranscriptionConfigRequest,
  EnhancedTranscriptionConfig,
  GetTranscriptionConfigRequest,
} from '../shared/models/transcription-config.model';
import {
  GetRealtimeTranscriptionModelRequest,
  realTimeTranscriptionModels,
} from '../shared/constants/transcription-models.constants';

@Injectable({
  providedIn: 'root',
})
export class TranscriptionConfigsService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'realtime-transcription-model-configs/';
  }

  // GET all transcription configs with limit=1000
  getTranscriptionConfigs(): Observable<GetTranscriptionConfigRequest[]> {
    const url = `${this.apiUrl}?limit=1000`;
    return this.http
      .get<ApiGetRequest<GetTranscriptionConfigRequest>>(url)
      .pipe(map((response) => response.results));
  }

  // GET transcription config by ID
  getTranscriptionConfigById(
    id: number
  ): Observable<GetTranscriptionConfigRequest> {
    return this.http.get<GetTranscriptionConfigRequest>(`${this.apiUrl}${id}/`);
  }
  getTranscriptionConfigsByProviderId(
    providerId: number
  ): Observable<GetTranscriptionConfigRequest[]> {
    const url = `${this.apiUrl}?limit=1000&model_provider_id=${providerId}`;
    return this.http
      .get<ApiGetRequest<GetTranscriptionConfigRequest>>(url)
      .pipe(map((response) => response.results));
  }
  // POST create transcription config
  createTranscriptionConfig(
    config: CreateTranscriptionConfigRequest
  ): Observable<GetTranscriptionConfigRequest> {
    return this.http.post<GetTranscriptionConfigRequest>(this.apiUrl, config, {
      headers: this.headers,
    });
  }

  // DELETE transcription config
  deleteTranscriptionConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }

  // GET all transcription configs with limit=1000 and enhanced with model_name
  getEnhancedTranscriptionConfigs(): Observable<EnhancedTranscriptionConfig[]> {
    const url = `${this.apiUrl}?limit=1000`;
    return this.http
      .get<ApiGetRequest<GetTranscriptionConfigRequest>>(url)
      .pipe(
        map((response) => response.results),
        map((configs) =>
          configs.map((config) => {
            const model: GetRealtimeTranscriptionModelRequest | undefined =
              realTimeTranscriptionModels.find(
                (m: GetRealtimeTranscriptionModelRequest) =>
                  m.id === config.realtime_transcription_model
              );
            return {
              ...config,
              model_name: model ? model.name : 'Unknown model',
            };
          })
        )
      );
  }
}
