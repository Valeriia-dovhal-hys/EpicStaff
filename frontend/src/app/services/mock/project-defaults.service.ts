import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ProjectDefaults,
  UpdateProjectDefaultsRequest,
} from './project-defaults.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectDefaultsService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'default-crew-config/';
  }

  // GET Project Defaults
  public getProjectDefaults(): Observable<ProjectDefaults> {
    return this.http.get<ProjectDefaults>(this.apiUrl);
  }

  // PUT Update Project Defaults
  public updateProjectDefaults(
    updatedDefaults: UpdateProjectDefaultsRequest
  ): Observable<ProjectDefaults> {
    return this.http.put<ProjectDefaults>(this.apiUrl, updatedDefaults, {
      headers: this.headers,
    });
  }
}
