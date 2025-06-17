// project-menu.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectMenuService {
  // Subject that emits when a menu should close
  private closeAllMenus$ = new Subject<void>();

  // Observable that components can subscribe to
  public get onCloseAllMenus() {
    return this.closeAllMenus$.asObservable();
  }

  // Method to trigger closing all menus
  public closeAllMenus(): void {
    this.closeAllMenus$.next();
  }
}
