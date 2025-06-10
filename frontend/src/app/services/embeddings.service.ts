import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { EmbeddingModel } from '../shared/models/embedding.model';

@Injectable({
  providedIn: 'root',
})
export class EmbeddingModelsService {
  private apiUrl = 'http://127.0.0.1:8000/api/embedding-models/';

  constructor(private http: HttpClient) {}

  getEmbeddingModels(): Observable<EmbeddingModel[]> {
    return this.http
      .get<ApiGetRequest<EmbeddingModel>>(this.apiUrl)
      .pipe(map((response: ApiGetRequest<EmbeddingModel>) => response.results));
  }
}
