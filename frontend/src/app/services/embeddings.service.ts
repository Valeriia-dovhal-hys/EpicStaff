import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { EmbeddingModel } from '../shared/models/embedding.model';
import { ConfigService } from './config/config.service';

@Injectable({
  providedIn: 'root',
})
export class EmbeddingModelsService {
  // Property to hold the cached observable
  private models$!: Observable<EmbeddingModel[]>;

  constructor(private http: HttpClient, private configService: ConfigService) {
    // Initialize the models cache in the constructor
    this.initializeModelsCache();
  }

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'embedding-models/';
  }

  // Initialize the cache
  private initializeModelsCache(): void {
    this.models$ = this.http
      .get<ApiGetRequest<EmbeddingModel>>(this.apiUrl)
      .pipe(
        map((response: ApiGetRequest<EmbeddingModel>) => response.results),
        shareReplay(1)
      );
  }

  /**
   * Gets embedding models, fetching from API only on first call
   * and returning cached data for subsequent calls
   */
  getEmbeddingModels(): Observable<EmbeddingModel[]> {
    return this.models$;
  }

  /**
   * Force refresh the models cache
   */
  refreshModels(): Observable<EmbeddingModel[]> {
    this.initializeModelsCache();
    return this.models$;
  }

  /**
   * Get a specific embedding model by ID.
   * First tries to find it in the cached models,
   * falls back to API call if not found.
   */
  getEmbeddingModelById(id: number): Observable<EmbeddingModel> {
    return this.models$.pipe(
      switchMap((models) => {
        // Try to find the model in the cache first
        const cachedModel = models.find((model) => model.id === id);

        if (cachedModel) {
          return of(cachedModel);
        }

        // If not found in cache, fetch from API
        const url: string = `${this.apiUrl}${id}/`;
        return this.http.get<EmbeddingModel>(url);
      })
    );
  }
}
