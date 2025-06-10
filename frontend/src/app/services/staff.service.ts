import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Agent, getAgentsRequest } from '../shared/models/agent.model';

@Injectable({
  providedIn: 'root',
})
export class AgentsService {
  private apiUrl = 'http://127.0.0.1:8000/api/agents';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  // GET
  getAgents(): Observable<getAgentsRequest> {
    return this.http.get<getAgentsRequest>(this.apiUrl);
  }

  // GET agent by ID
  getAgentById(agentId: number): Observable<Agent> {
    return this.http.get<Agent>(`${this.apiUrl}/${agentId}`);
  }

  // POST
  createAgent(agent: Agent): Observable<Agent> {
    return this.http.post<Agent>(`${this.apiUrl}/`, agent, {
      headers: this.headers,
    });
  }

  // PUT
  updateAgent(agent: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.apiUrl}/${agent.id}/`, agent, {
      headers: this.headers,
    });
  }
  // DELETE
  deleteAgent(agentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${agentId}/`, {
      headers: this.headers,
    });
  }
}
