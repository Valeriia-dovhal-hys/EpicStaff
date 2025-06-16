import { Component, computed, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { CustomSidenavComponent } from './custom-sidenav/custom-sidenav.component';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    CustomSidenavComponent,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  collapsed = signal(true);

  // sidenavWidth = computed(() => (this.collapsed() ? '65px' : '250px'));

  // sidenavMode = signal<MatDrawerMode>('side');
  sidenavWidth = signal<string>('80px');

  // toggleSidenav() {
  //   this.collapsed.set(!this.collapsed());
  //   this.sidenavWidth.set(this.collapsed() ? '80px' : '240px');
  // }

  // onMouseEnter() {

  //   this.collapsed.set(false);
  //   this.sidenavWidth.set('240px');
  // }

  // onMouseLeave() {

  //   this.collapsed.set(true);
  //   this.sidenavWidth.set('80px');
  // }
}
