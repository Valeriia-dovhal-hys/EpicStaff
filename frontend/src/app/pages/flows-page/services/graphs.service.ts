import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateGraphDtoRequest,
  GraphDto,
  UpdateGraphDtoRequest,
} from '../models/graph.model';
import { ApiGetRequest } from '../../../shared/models/api-request.model';
import { ConfigService } from '../../../services/config/config.service';

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'graphs/';
  }

  getGraphs(): Observable<GraphDto[]> {
    return this.http
      .get<ApiGetRequest<GraphDto>>(this.apiUrl)
      .pipe(map((response) => response.results));
  }

  getGraphById(id: number): Observable<GraphDto> {
    return this.http.get<GraphDto>(`${this.apiUrl}${id}/`);
  }

  createGraph(graphDto: CreateGraphDtoRequest): Observable<GraphDto> {
    return this.http.post<GraphDto>(this.apiUrl, graphDto, {
      headers: this.headers,
    });
  }

  updateGraph(graphDto: UpdateGraphDtoRequest): Observable<GraphDto> {
    return this.http.put<GraphDto>(
      `${this.apiUrl}${graphDto.id}/`,
      graphDto,
      {
        headers: this.headers,
      }
    );
  }

  deleteGraph(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
