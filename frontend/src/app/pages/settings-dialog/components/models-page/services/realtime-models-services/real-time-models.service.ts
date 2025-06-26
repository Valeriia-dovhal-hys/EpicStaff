import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ConfigService } from '../../../../../../services/config/config.service';
import { ApiGetResponse } from '../../../../../../services/transcription-models.service';

export interface RealtimeModel {
  id: number;
  name: string;
  provider: number;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeModelsService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'realtime-models/';
  }

  getAllModels(): Observable<RealtimeModel[]> {
    return this.http
      .get<ApiGetResponse<RealtimeModel>>(this.apiUrl, {
        headers: this.headers,
      })
      .pipe(map((response) => response.results));
  }

  getModelById(id: number): Observable<RealtimeModel> {
    return this.http.get<RealtimeModel>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
