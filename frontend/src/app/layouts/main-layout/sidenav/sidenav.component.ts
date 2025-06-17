import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '../../../shared/constants/icons.constants';
import { TooltipComponent } from './tooltip.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { SettingsDialogComponent } from '../../../pages/settings-dialog/settings-dialog.component';

interface NavItem {
  id: string;
  routeLink?: string;
  svgIcon: SafeHtml;
  label: string;
  showTooltip: boolean;
  action?: () => void;
  customClass?: string;
}

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [TooltipComponent, RouterLinkActive, RouterLink],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftSidebarComponent {
  public topNavItems: NavItem[];
  public bottomNavItems: NavItem[];

  constructor(private sanitizer: DomSanitizer, private dialog: Dialog) {
    this.topNavItems = [
      {
        id: 'projects',
        routeLink: 'projects',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.projects),
        label: 'Projects',
        showTooltip: false,
      },
      {
        id: 'staff',
        routeLink: 'staff',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.staff),
        label: 'Staff',
        showTooltip: false,
      },
      {
        id: 'tools',
        routeLink: 'tools',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.tools),
        label: 'Tools',
        showTooltip: false,
      },
      {
        id: 'flows',
        routeLink: 'flows',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.flows),
        label: 'Flows',
        showTooltip: false,
      },
      {
        id: 'knowledge-sources',
        routeLink: 'knowledge-sources',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.sources),
        label: 'Knowledge Sources',
        showTooltip: false,
      },
      {
        id: 'chats',
        routeLink: 'chats',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.chats),
        label: 'Chats',
        showTooltip: false,
      },
    ];

    this.bottomNavItems = [
      {
        id: 'settings',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.settings),
        label: 'Settings',
        showTooltip: false,
        action: () => this.onSettingsClick(),
        customClass: 'settings-tooltip',
      },
    ];
  }

  public trackItem(index: number, item: NavItem) {
    return item.id;
  }

  private onSettingsClick(): void {
    this.dialog.open(SettingsDialogComponent, {
      width: '500px',
      height: '560px',
    });
  }

  public handleItemClick(item: NavItem, event: MouseEvent): void {
    if (item.action) {
      event.preventDefault();
      item.action();
    }
  }
}
