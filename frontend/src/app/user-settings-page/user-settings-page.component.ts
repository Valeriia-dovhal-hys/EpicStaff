import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-user-settings-page',
    imports: [MatIconModule, MatButtonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './user-settings-page.component.html',
    styleUrls: ['./user-settings-page.component.scss']
})
export class UserSettingsPageComponent {
  constructor(private location: Location, private router: Router) {}

  goBack() {
    this.router.navigate(['projects-list']);
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
