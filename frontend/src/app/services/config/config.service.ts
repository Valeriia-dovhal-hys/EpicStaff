// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: any = null;

  constructor(private http: HttpClient) {}

  loadConfig() {
    return this.http
      .get('/config.json')
      .toPromise()
      .then((config) => {
        this.config = config;
        console.log('fetched config file', this.config);
      })
      .catch((err) => {
        // Fallback to environment values if the external config is not available
        this.config = {
          apiUrl: environment.apiUrl,
          realtimeApiUrl: environment.realtimeApiUrl, // Add fallback for realtimeApiUrl
        };
      });
  }

  get apiUrl(): string {
    return this.config?.apiUrl;
  }

  get realtimeApiUrl(): string {
    return this.config?.realtimeApiUrl;
  }
}
