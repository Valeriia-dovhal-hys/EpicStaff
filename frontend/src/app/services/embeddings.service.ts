import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { EmbeddingModel } from '../shared/models/embedding.model';
import { ConfigService } from './config/config.service';

@Injectable({
  providedIn: 'root',
})
export class EmbeddingModelsService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'embedding-models/';
  }

  getEmbeddingModels(): Observable<EmbeddingModel[]> {
    return this.http
      .get<ApiGetRequest<EmbeddingModel>>(this.apiUrl)
      .pipe(map((response: ApiGetRequest<EmbeddingModel>) => response.results));
  }

  getEmbeddingModelById(id: number): Observable<EmbeddingModel> {
    const url: string = `${this.apiUrl}${id}/`;
    return this.http.get<EmbeddingModel>(url);
  }
}
