// src/app/services/config.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, firstValueFrom, of } from 'rxjs';

export interface AppConfig {
  apiUrl: string;
  type: string;
  realtimeApiUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: AppConfig | null = null;
  private readonly http = inject(HttpClient);

  async loadConfig(): Promise<void> {
    try {
      // Use the correct path for assets in Angular
      const config = await firstValueFrom(
        this.http.get<AppConfig>('/config.json').pipe(
          catchError((error) => {
            console.warn('Could not load config file:', error);
            // Fallback to environment values
            return of({
              type: 'fallback',
              apiUrl: environment.apiUrl,

              realtimeApiUrl: environment.realtimeApiUrl,
            } as AppConfig);
          })
        )
      );

      this.config = config;
      console.log('Configuration loaded:', this.config);
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Set fallback values if everything fails
      this.config = {
        type: 'fallback',
        apiUrl: environment.apiUrl,
        realtimeApiUrl: environment.realtimeApiUrl,
      };
    }
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  get apiUrl(): string {
    if (!this.config) {
      console.warn('Config not loaded, using fallback API URL');
      return environment.apiUrl;
    }
    return this.config.apiUrl;
  }

  get realtimeApiUrl(): string {
    if (!this.config || !this.config.realtimeApiUrl) {
      console.warn('Realtime API URL not available, using fallback');
      return environment.realtimeApiUrl || '';
    }
    return this.config.realtimeApiUrl;
  }
}
