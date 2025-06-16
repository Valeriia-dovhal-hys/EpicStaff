import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-user-settings-page',
  standalone: true,
  imports: [MatIconModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './user-settings-page.component.html',
  styleUrl: './user-settings-page.component.scss',
})
export class UserSettingsPageComponent {}
