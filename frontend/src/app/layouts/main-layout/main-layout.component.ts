import { Component } from '@angular/core';
import { LeftSidebarComponent } from './sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [LeftSidebarComponent, RouterOutlet],
  template: `
    <div class="app-layout" style="display: flex; height: 100%; width: 100%;">
      <app-left-sidebar></app-left-sidebar>
      <div class="main-content" style="flex: 1; ">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {}
