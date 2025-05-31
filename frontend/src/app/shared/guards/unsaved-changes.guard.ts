import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

import { Observable } from 'rxjs';

import { StaffComponent } from '../../handsontable-tables/staff/staff.component';
import { MainComponent } from '../../main/main.component';
import { ProjectTasksTableComponent } from '../../handsontable-tables/project-tasks-table/project-tasks-table.component';

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
