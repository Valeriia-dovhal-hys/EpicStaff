import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AgentDefaults,
  UpdateAgentDefaultsRequest,
} from './agent-defaults.model';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root',
})
export class AgentDefaultsService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'default-agent-config/';
  }

  // Fetch agent defaults
  public getAgentDefaults(): Observable<AgentDefaults> {
    return this.http.get<AgentDefaults>(this.apiUrl);
  }

  // Update agent defaults
  public updateAgentDefaults(
    updatedDefaults: UpdateAgentDefaultsRequest
  ): Observable<AgentDefaults> {
    return this.http.put<AgentDefaults>(this.apiUrl, updatedDefaults);
  }
}
