import { NgClass } from '@angular/common';
import { Component, computed, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

export type MenuItem = {
  icon: string;
  label: string;
  route?: string;
};

@Component({
  selector: 'app-custom-sidenav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatListModule,
    MatIconModule,
  ],
  templateUrl: './custom-sidenav.component.html',
  styleUrl: './custom-sidenav.component.scss',
})
export class CustomSidenavComponent {
  sideNavCollapsed = signal(true);

  @Input() set collapsed(val: boolean) {
    this.sideNavCollapsed.set(val);
  }

  menuItems = signal<MenuItem[]>([
    // {
    //   icon: 'dashboard',
    //   label: 'Main Page',
    //   route: '',
    // },
    {
      icon: 'folder',
      label: 'Projects List',
      route: 'projects-list',
    },

    {
      icon: 'dashboard',
      label: 'Staff',
      route: 'staff',
    },
    // {
    //   icon: 'assignment',
    //   label: 'All tasks',
    //   route: 'tasks-templates',
    // },
    // {
    //   icon: 'dashboard',
    //   label: 'Main Page',
    //   route: 'test-table-dialog',
    // },
    // {
    //   icon: 'dashboard',
    //   label: 'Main Page',
    //   route: 'test-table-data',
    // },
    // {
    //   icon: 'dashboard',
    //   label: 'Main Page',
    //   route: 'right-init',
    // },
    // {
    //   icon: 'folder_open',
    //   label: 'popup',
    //   route: 'popup',
    // },

    // {
    //   icon: 'table_chart',
    //   label: 'Agents Table',
    //   route: 'agents-table',
    // },
    // {
    //   icon: 'assignment',
    //   label: 'Tasks Table',
    //   route: 'tasks-table',
    // },
  ]);

  profilePicSize = computed(() => (this.sideNavCollapsed() ? '32' : '100'));
}
