import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DropdownManagerService {
  // Subject that emits when a dropdown opens
  private dropdownOpenedSource = new Subject<string>();
  dropdownOpened$ = this.dropdownOpenedSource.asObservable();

  // Notify that a dropdown has been opened
  notifyDropdownOpened(dropdownId: string): void {
    this.dropdownOpenedSource.next(dropdownId);
  }
}
