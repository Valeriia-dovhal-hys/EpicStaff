import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap, Observable } from 'rxjs';
import { ApiGetRequest } from '../shared/models/api-request.model';
import { RunCrewSessionRequest } from '../shared/models/RunCrewSession.model';
import { CrewRunMessage } from '../shared/models/crew_run_message.model';
import { Session } from '../shared/models/sesson.model';
import { TaskMessage } from '../shared/models/task-message.model';
import { AgentMessage } from '../shared/models/agent-message.model';
import { UserMessage } from '../shared/models/user-message.model';
import { ConfigService } from './config/config.service';

@Injectable({
  providedIn: 'root',
})
export class RunCrewSessionService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API base URL from ConfigService
  private get baseUrl(): string {
    return this.configService.apiUrl;
  }

  getAllSessions(): Observable<Session[]> {
    const url = `${this.baseUrl}sessions/`;
    return this.http
      .get<ApiGetRequest<Session>>(url)
      .pipe(map((response: ApiGetRequest<Session>) => response.results));
  }

  getSessionsByProjectId(projectId: number): Observable<Session[]> {
    const url = `${this.baseUrl}sessions/`;
    return this.http.get<ApiGetRequest<Session>>(url).pipe(
      tap((response: ApiGetRequest<Session>) => {
        console.log('All sessions received:', response.results);
      }),
      map((response: ApiGetRequest<Session>) => response.results),
      map((sessions: Session[]) =>
        sessions.filter((session) => session.crew === projectId)
      )
    );
  }

  createSession(crewId: number): Observable<RunCrewSessionRequest> {
    const payload = { crew_id: crewId };
    const url = `${this.baseUrl}run-session/`;
    return this.http.post<RunCrewSessionRequest>(url, payload);
  }

  stopSession(sessionId: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}sessions/${sessionId}/stop/`,
      {}
    );
  }

  getMessages(sessionId: number): Observable<CrewRunMessage[]> {
    const url = `${this.baseUrl}sessions/${sessionId}/messages/`;
    return this.http
      .get<ApiGetRequest<CrewRunMessage>>(url)
      .pipe(map((response: ApiGetRequest<CrewRunMessage>) => response.results));
  }

  getSession(sessionId: number): Observable<Session> {
    const url = `${this.baseUrl}sessions/${sessionId}/`;
    return this.http.get<Session>(url);
  }

  answerToLLM(sessionId: number, answer: string): Observable<any> {
    const url = `${this.baseUrl}answer-to-llm/`;
    const payload = { session_id: sessionId, answer: answer };
    return this.http.post<any>(url, payload);
  }

  getAgentMessages(sessionId: number): Observable<AgentMessage[]> {
    const url = `${this.baseUrl}agent-messages/?session_id=${sessionId}`;
    return this.http
      .get<ApiGetRequest<AgentMessage>>(url)
      .pipe(map((response: ApiGetRequest<AgentMessage>) => response.results));
  }

  getTaskMessages(sessionId: number): Observable<TaskMessage[]> {
    const url = `${this.baseUrl}task-messages/?session_id=${sessionId}`;
    return this.http
      .get<ApiGetRequest<TaskMessage>>(url)
      .pipe(map((response: ApiGetRequest<TaskMessage>) => response.results));
  }

  getUserMessages(sessionId: number): Observable<UserMessage[]> {
    const url = `${this.baseUrl}user-messages/?session_id=${sessionId}`;
    return this.http
      .get<ApiGetRequest<UserMessage>>(url)
      .pipe(map((response: ApiGetRequest<UserMessage>) => response.results));
  }
}
