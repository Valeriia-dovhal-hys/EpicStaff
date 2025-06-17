import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { GetLlmModelRequest, LLM_Model } from '../shared/models/LLM.model';
import { ConfigService } from './config/config.service';

@Injectable({
  providedIn: 'root',
})
export class LLM_Models_Service {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'llm-models/';
  }

  getLLMModels(): Observable<GetLlmModelRequest[]> {
    return this.http
      .get<ApiGetRequest<GetLlmModelRequest>>(this.apiUrl)
      .pipe(
        map((response: ApiGetRequest<GetLlmModelRequest>) => response.results)
      );
  }

  getLLMModelById(id: number): Observable<LLM_Model> {
    return this.http.get<LLM_Model>(`${this.apiUrl}${id}/`);
  }
}
