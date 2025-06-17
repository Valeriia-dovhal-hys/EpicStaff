import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Source } from '../models/source.model'; // adjust path as needed
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
export class SourcesService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'sources/';
  }

  getSources(): Observable<Source[]> {
    return this.http
      .get<ApiGetRequest<Source>>(this.apiUrl)
      .pipe(map((res) => res.results));
  }

  getSourceById(documentId: number): Observable<Source> {
    return this.http.get<Source>(`${this.apiUrl}${documentId}/`);
  }

  deleteSource(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${documentId}/`);
  }
}
