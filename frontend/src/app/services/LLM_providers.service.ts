// src/app/services/providers.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiRequest } from '../shared/models/api-request.model';
import { LLM_Provider } from '../shared/models/LLM_provider.model';

@Injectable({
  providedIn: 'root',
})
export class LLM_Providers_Service {
  private apiUrl = 'http://127.0.0.1:8000/api/providers/';

  constructor(private http: HttpClient) {}

  getProviders(): Observable<LLM_Provider[]> {
    return this.http
      .get<ApiRequest<LLM_Provider>>(this.apiUrl)
      .pipe(map((response: ApiRequest<LLM_Provider>) => response.results));
  }
}
