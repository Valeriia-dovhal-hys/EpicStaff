import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePythonCodeRequest,
  GetPythonCodeRequest,
} from '../models/python-code.model';
import { ConfigService } from '../../../../services/config/config.service';

@Injectable({
  providedIn: 'root',
})
export class PythonCodeService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient, private configService: ConfigService) {}

  // Dynamically retrieve the API URL from ConfigService
  private get apiUrl(): string {
    return this.configService.apiUrl + 'python-code/';
  }

  createPythonCode(request: CreatePythonCodeRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request, {
      headers: this.headers,
    });
  }

  getPythonCodeById(id: number): Observable<GetPythonCodeRequest> {
    return this.http.get<GetPythonCodeRequest>(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }

  deletePythonCode(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`, {
      headers: this.headers,
    });
  }
}
