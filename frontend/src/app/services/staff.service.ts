// src/app/services/agents.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  Agent,
  CreateAgentRequest,
  GetAgentRequest,
} from '../shared/models/agent.model';
import { ApiGetRequest } from '../shared/models/api-request.model';

@Injectable({
  providedIn: 'root',
})
export class AgentsService {
  private apiUrl = 'http://127.0.0.1:8000/api/agents/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  // GET all agents
  getAgents(): Observable<Agent[]> {
    return this.http
      .get<ApiGetRequest<Agent>>(this.apiUrl)
      .pipe(map((response: ApiGetRequest<Agent>) => response.results));
  }

  // GET agent by ID
  getAgentById(agentId: number): Observable<Agent> {
    return this.http.get<Agent>(`${this.apiUrl}${agentId}/`);
  }

  // POST create agent
  createAgent(agent: CreateAgentRequest): Observable<Agent> {
    return this.http.post<Agent>(this.apiUrl, agent, {
      headers: this.headers,
    });
  }

  // PUT update agent
  updateAgent(agent: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.apiUrl}${agent.id}/`, agent, {
      headers: this.headers,
    });
  }

  // DELETE agent
  deleteAgent(agentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${agentId}/`, {
      headers: this.headers,
    });
  }
}
