import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiRequest } from '../shared/models/api-response.model';
import { LLMModel } from '../shared/models/LLM.model';

@Injectable({
  providedIn: 'root',
})
export class LLMModelsService {
  private apiUrl = 'http://127.0.0.1:8000/api/llm-models/';

  constructor(private http: HttpClient) {}

  getLLMModels(): Observable<LLMModel[]> {
    return this.http
      .get<ApiRequest<LLMModel>>(this.apiUrl)
      .pipe(map((response: ApiRequest<LLMModel>) => response.results));
  }
}
