import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphMessage } from '../pages/running-graph/models/graph-session-message.model';
import { ConfigService } from './config/config.service';

export interface GraphSessionMessagesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GraphMessage[];
}

@Injectable({
  providedIn: 'root',
})
export class GraphSessionMessagesService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl;
  }

  getGraphSessionMessages(
    sessionId: string | number
  ): Observable<GraphMessage[]> {
    const params = new HttpParams().set('session_id', sessionId.toString());
    return this.http
      .get<GraphSessionMessagesResponse>(
        `${this.apiUrl}graph-session-messages/`,
        { params }
      )
      .pipe(map((response) => response.results));
  }
}
