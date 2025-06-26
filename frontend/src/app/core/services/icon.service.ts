import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IconService {
  private cache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  getIcon(path: string): Observable<string> {
    if (this.cache.has(path)) {
      return of(this.cache.get(path)!);
    }

    return this.http.get(path, { responseType: 'text' }).pipe(
      tap((svg) => this.cache.set(path, svg)),
      catchError((error) => {
        console.error(`Failed to load icon: ${path}`, error);
        return throwError(() => error);
      })
    );
  }

  preloadIcons(paths: string[]): Observable<string[]> {
    const loadPromises = paths.map((path) => this.getIcon(path).toPromise());
    return of(paths);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
