import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config/config.service';

export interface AnswerToLLMRequest {
  session_id: number;
  crew_id: number;
  execution_order: number;
  name: string;
  answer: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnswerToLLMService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    // If you want 'answer-to-llm/' appended here, do it like this:
    // return this.configService.apiUrl + 'answer-to-llm/';
    return this.configService.apiUrl;
  }

  public sendAnswerToLLM(data: AnswerToLLMRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}answer-to-llm/`, data, {
      headers: this.headers,
    });
  }
}
