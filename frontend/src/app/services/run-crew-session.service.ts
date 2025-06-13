import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { RunCrewSessionRequest } from '../shared/models/RunCrewSession.model';
import { CrewRunMessage } from '../shared/models/crew_run_message.model';

export interface Session {
  id: number;
  crew: number | null;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class RunCrewSessionService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  createSession(crewId: number): Observable<RunCrewSessionRequest> {
    const payload = { crew_id: crewId };
    const url = `${this.apiUrl}/run-session/`;
    return this.http.post<RunCrewSessionRequest>(url, payload);
  }

  stopSession(sessionId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/sessions/${sessionId}/stop`,
      {}
    );
  }
  getMessages(sessionId: number): Observable<CrewRunMessage[]> {
    const url = `${this.apiUrl}/sessions/${sessionId}/messages`;
    return this.http
      .get<ApiGetRequest<CrewRunMessage>>(url)
      .pipe(map((response: ApiGetRequest<CrewRunMessage>) => response.results));
  }

  getSession(sessionId: number): Observable<Session> {
    const url = `${this.apiUrl}/sessions/${sessionId}/`;
    return this.http.get<Session>(url);
  }
}
