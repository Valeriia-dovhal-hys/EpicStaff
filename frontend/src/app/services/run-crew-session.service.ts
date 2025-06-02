import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface for the createSession response
export interface RunCrewSessionResponse {
  session_id: number;
}

// Interface for individual messages
export interface Message {
  id: number;
  text: string;
  created_at: string;
  message_from: string;
  session: number;
}

// Interface for the getMessages response
export interface GetMessagesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Message[];
}

@Injectable({
  providedIn: 'root',
})
export class RunCrewSessionService {
  private apiBaseUrl = 'http://127.0.0.1:8000/api';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  createSession(crewId: number): Observable<RunCrewSessionResponse> {
    const payload = { crew_id: crewId };
    const url = `${this.apiBaseUrl}/run-session/`;
    return this.http.post<RunCrewSessionResponse>(url, payload, {
      headers: this.headers,
    });
  }

  getMessages(sessionId: number): Observable<GetMessagesResponse> {
    const url = `${this.apiBaseUrl}/sessions/${sessionId}/messages`;
    return this.http.get<GetMessagesResponse>(url, { headers: this.headers });
  }
}
