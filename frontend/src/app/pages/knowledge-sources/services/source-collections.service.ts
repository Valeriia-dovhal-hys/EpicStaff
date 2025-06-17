import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SourceCollection,
  UploadSourceCollection,
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

  getSourceCollections(limit = 1000): Observable<SourceCollection[]> {
    return this.http
      .get<ApiGetRequest<SourceCollection>>(`${this.apiUrl}?limit=${limit}`)
      .pipe(map((res) => res.results));
  }

  getSourceCollectionById(id: number): Observable<SourceCollection> {
    return this.http.get<SourceCollection>(`${this.apiUrl}${id}/`);
  }

  createSourceCollection(formData: any): Observable<SourceCollection> {
    return this.http.post<SourceCollection>(this.apiUrl, formData);
  }

  patchSourceCollection(
    collectionId: number,
    collectionName: string
  ): Observable<SourceCollection> {
    return this.http.patch<SourceCollection>(`${this.apiUrl}${collectionId}/`, {
      collection_name: collectionName,
    });
  }

  deleteSourceCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  uploadFiles(
    collectionId: number,
    formData: FormData
  ): Observable<SourceCollection> {
    return this.http.patch<SourceCollection>(
      `${this.apiUrl}${collectionId}/add-sources/`,
      formData
    );
  }

  addSourcesToCollection(
    collectionId: number,
    sourceIds: number[]
  ): Observable<SourceCollection> {
    return this.http.patch<SourceCollection>(
      `${this.apiUrl}${collectionId}/add-sources/`,
      { sources: sourceIds }
    );
  }
}
