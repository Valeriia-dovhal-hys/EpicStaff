import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiRequest } from '../shared/models/api-response.model';
import { ConfigLLM } from '../shared/models/config_llm.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigLLMService {
  private apiUrl = 'http://127.0.0.1:8000/api/config-llm/';

  constructor(private http: HttpClient) {}

  getConfigLLM(): Observable<ConfigLLM[]> {
    return this.http
      .get<ApiRequest<ConfigLLM>>(this.apiUrl)
      .pipe(map((response: ApiRequest<ConfigLLM>) => response.results));
  }
}
