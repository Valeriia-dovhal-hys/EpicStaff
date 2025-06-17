import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

import { Observable } from 'rxjs';

import { MainComponent } from '../../main/main.component';

@Injectable({
  providedIn: 'root',
})
export class UnsavedChangesGuard<T> implements CanDeactivate<T> {
  canDeactivate(
    component: T
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Ensure component has canDeactivate method
    if ((component as any).canDeactivate) {
      return (component as any).canDeactivate();
    }
    return true;
  }
}
