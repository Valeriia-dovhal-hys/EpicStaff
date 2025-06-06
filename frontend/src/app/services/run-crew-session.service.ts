import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiRequest } from '../shared/models/api-request.model';
import { RunCrewSessionRequest } from '../shared/models/RunCrewSession.model';
import { CrewRunMessage } from '../shared/models/crew_run_message.model';

@Injectable({
  providedIn: 'root',
})
export class RunCrewSessionService {
  private apiBaseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  createSession(crewId: number): Observable<RunCrewSessionRequest> {
    const payload = { crew_id: crewId };
    const url = `${this.apiBaseUrl}/run-session/`;
    return this.http.post<RunCrewSessionRequest>(url, payload);
  }

  getMessages(sessionId: number): Observable<CrewRunMessage[]> {
    const url = `${this.apiBaseUrl}/sessions/${sessionId}/messages`;
    return this.http
      .get<ApiRequest<CrewRunMessage>>(url)
      .pipe(map((response: ApiRequest<CrewRunMessage>) => response.results));
  }
}
