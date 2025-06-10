import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { LLM_Model } from '../shared/models/LLM.model';

@Injectable({
  providedIn: 'root',
})
export class LLM_Models_Service {
  private apiUrl = 'http://127.0.0.1:8000/api/llm-models/';

  constructor(private http: HttpClient) {}

  getLLMModels(): Observable<LLM_Model[]> {
    return this.http
      .get<ApiGetRequest<LLM_Model>>(this.apiUrl)
      .pipe(map((response: ApiGetRequest<LLM_Model>) => response.results));
  }

  getLLMModelById(id: number): Observable<LLM_Model> {
    return this.http.get<LLM_Model>(`${this.apiUrl}${id}/`);
  }
}
