import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  GetSourceCollectionRequest,
  ChunkStrategy,
} from '../models/source-collection.model';
import { ConfigService } from '../../../services/config/config.service';

interface ApiGetRequest<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'source-collections/';
  }

  getGetSourceCollectionRequests(
    limit = 1000
  ): Observable<GetSourceCollectionRequest[]> {
    return this.http
      .get<ApiGetRequest<GetSourceCollectionRequest>>(
        `${this.apiUrl}?limit=${limit}`
      )
      .pipe(map((res) => res.results));
  }

  getGetSourceCollectionRequestById(
    id: number
  ): Observable<GetSourceCollectionRequest> {
    return this.http.get<GetSourceCollectionRequest>(`${this.apiUrl}${id}/`);
  }

  createGetSourceCollectionRequest(
    formData: any
  ): Observable<GetSourceCollectionRequest> {
    return this.http.post<GetSourceCollectionRequest>(this.apiUrl, formData);
  }

  patchGetSourceCollectionRequest(
    collectionId: number,
    collectionName: string
  ): Observable<GetSourceCollectionRequest> {
    return this.http.patch<GetSourceCollectionRequest>(
      `${this.apiUrl}${collectionId}/`,
      {
        collection_name: collectionName,
      }
    );
  }

  deleteGetSourceCollectionRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  uploadFiles(
    collectionId: number,
    formData: FormData
  ): Observable<GetSourceCollectionRequest> {
    return this.http.patch<GetSourceCollectionRequest>(
      `${this.apiUrl}${collectionId}/add-sources/`,
      formData
    );
  }

  addSourcesToCollection(
    collectionId: number,
    sourceIds: number[]
  ): Observable<GetSourceCollectionRequest> {
    return this.http.patch<GetSourceCollectionRequest>(
      `${this.apiUrl}${collectionId}/add-sources/`,
      { sources: sourceIds }
    );
  }
}
