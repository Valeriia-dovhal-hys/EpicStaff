// system-settings.component.ts

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-system-settings',
    templateUrl: './system-settings.component.html',
    styleUrls: ['./system-settings.component.scss'],
    imports: [FormsModule]
})
export class SystemSettingsComponent implements OnInit {
  isDarkTheme = true;

  ngOnInit(): void {
    // Check for saved theme preference
    const theme = localStorage.getItem('theme') || 'light';
    this.isDarkTheme = theme === 'dark';
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const theme = this.isDarkTheme ? 'dark' : 'light';
    this.applyTheme(theme);
  }

  applyTheme(theme: string): void {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
  }

  ngOnDestroy(): void {
    // Always apply the dark theme on component destruction
    this.applyTheme('dark');
  }
}
