import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '../shared/constants/icons.constants';
import { TooltipComponent } from './tooltip.component';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [TooltipComponent, NgFor, RouterLinkActive, RouterLink],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftSidebarComponent {
  public items: {
    routeLink: string;
    icon?: string;
    svgIcon: SafeHtml;
    label: string;
    showTooltip: boolean;
  }[];

  constructor(private sanitizer: DomSanitizer) {
    this.items = [
      {
        routeLink: 'projects',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.projects),
        label: 'Projects',
        showTooltip: false,
      },

      {
        routeLink: 'staff',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.staff),
        label: 'Staff',
        showTooltip: false,
      },
      {
        routeLink: 'tools',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.tools),
        label: 'Tools',
        showTooltip: false,
      },
      {
        routeLink: 'models',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.models),
        label: 'Models',
        showTooltip: false,
      },
      {
        routeLink: 'flows',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.flows),
        label: 'Flows',
        showTooltip: false,
      },
      {
        routeLink: 'knowledge-sources',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.sources),
        label: 'Knowledge Sources',
        showTooltip: false,
      },
      {
        routeLink: 'chats',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.chats),
        label: 'Chats',
        showTooltip: false,
      },
      //   {
      //     routeLink: 'settings',
      //     svgIcon: this.sanitizer.bypassSecurityTrustHtml(ICONS.settings),
      //     label: 'Settings',
      //     showTooltip: false,
      //   },
    ];
  }

  public trackItem(index: number, item: any) {
    return item.routeLink;
  }
}
