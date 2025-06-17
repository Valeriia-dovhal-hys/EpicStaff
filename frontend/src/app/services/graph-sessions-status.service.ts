import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ConfigService } from './config/config.service';

export interface GraphSessionGraph {
  id: number;
  name: string;
  metadata: any; // Using 'any' for now as you mentioned "don't care" for this field
}

export enum GraphSessionStatus {
  RUNNING = 'run',
  ERROR = 'error',
  ENDED = 'end',
  WAITING_FOR_USER = 'wait_for_user',
}

export interface GraphSession {
  id: number;
  graph: GraphSessionGraph;
  status: GraphSessionStatus;
  status_data: Record<string, any>;
  initial_state: Record<string, any>;
  created_at: string;
  finished_at: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class GraphSessionService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'sessions/';
  }

  /**
   * Get all sessions
   * If the API returns a paginated response, this will extract the results array
   */
  getAllSessions(): Observable<GraphSession[]> {
    return this.http
      .get<GraphSession[] | PaginatedResponse<GraphSession>>(this.apiUrl)
      .pipe(
        map((response) => {
          // Check if response is a paginated response
          if (
            response &&
            typeof response === 'object' &&
            'results' in response
          ) {
            return (response as PaginatedResponse<GraphSession>).results;
          }
          // If it's already an array
          if (Array.isArray(response)) {
            return response;
          }
          // Fallback for unexpected response format
          console.warn('Unexpected sessions response format:', response);
          return [];
        })
      );
  }

  getSessionById(sessionId: string | number): Observable<GraphSession> {
    return this.http.get<GraphSession>(`${this.apiUrl}${sessionId}/`);
  }

  getSessionsByGraphId(graphId: number): Observable<GraphSession[]> {
    const params = new HttpParams().set('graph_id', graphId.toString());
    return this.http
      .get<PaginatedResponse<GraphSession>>(this.apiUrl, { params })
      .pipe(
        map((response) => {
          // Check if response is a paginated response
          if (
            response &&
            typeof response === 'object' &&
            'results' in response
          ) {
            return response.results;
          }
          // If it's already an array
          if (Array.isArray(response)) {
            return response;
          }
          // Fallback for unexpected response format
          console.warn('Unexpected sessions response format:', response);
          return [];
        })
      );
  }
}
