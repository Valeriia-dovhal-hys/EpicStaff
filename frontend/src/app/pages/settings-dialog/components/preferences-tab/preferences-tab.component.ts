import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface ThemeOption {
  value: 'dark' | 'light' | 'system';
  label: string;
  icon: string;
}

interface LanguageOption {
  value: 'en' | 'uk' | 'nl';
  label: string;
  nativeName: string;
}

@Component({
  selector: 'app-preferences-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="tab-container">
      <div class="preference-section">
        <div class="section-title">{{ 'Theme' }}</div>
        <div class="theme-options">
          @for (option of themeOptions; track option.value) {
          <button
            class="theme-option"
            [class.selected]="currentTheme() === option.value"
            (click)="setTheme(option.value)"
          >
            <i class="ti {{ option.icon }}"></i>
            <span>{{ option.label }}</span>
          </button>
          }
        </div>
      </div>

      <div class="preference-section">
        <div class="section-title">{{ 'Interface Language' }}</div>
        <div class="language-options">
          @for (option of languageOptions; track option.value) {
          <button
            class="language-option"
            [class.selected]="currentLanguage() === option.value"
            (click)="setLanguage(option.value)"
          >
            <span class="language-name">{{ option.label }}</span>
            <span class="native-name">{{ option.nativeName }}</span>
          </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .tab-container {
        padding: 14px 20px 20px 20px;
        overflow-y: auto;
        max-height: 550px;
        color: var(--gray-100);
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .preference-section {
        margin-bottom: 20px;
        width: 100%;
        text-align: center;
      }

      .section-title {
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 12px 0;
        color: var(--gray-100);
      }

      .theme-options {
        display: flex;
        gap: 8px;
        justify-content: center;
      }

      .theme-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 70px;
        height: 70px;
        border-radius: 6px;
        background-color: var(--gray-800);
        border: 1px solid var(--gray-700);
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;

        &:hover {
          background-color: var(--gray-750);
          border-color: var(--gray-600);
        }

        &.selected {
          background-color: var(--gray-750);
          border-color: var(--accent-color);
          box-shadow: 0 0 0 1px var(--accent-color);
        }

        i {
          font-size: 20px;
          color: var(--gray-200);
        }

        span {
          font-size: 12px;
          color: var(--gray-200);
        }
      }

      .language-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
      }

      .language-option {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        width: 100%;
        padding: 10px 12px;
        border-radius: 6px;
        background-color: var(--gray-800);
        border: 1px solid var(--gray-700);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;

        &:hover {
          background-color: var(--gray-750);
          border-color: var(--gray-600);
        }

        &.selected {
          background-color: var(--gray-750);
          border-color: var(--accent-color);
          box-shadow: 0 0 0 1px var(--accent-color);
        }

        .language-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-100);
        }

        .native-name {
          font-size: 11px;
          color: var(--gray-400);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesTabComponent {
  // Theme options
  public themeOptions: ThemeOption[] = [
    { value: 'dark', label: 'Dark', icon: 'ti-moon' },
    { value: 'light', label: 'Light', icon: 'ti-sun' },
    { value: 'system', label: 'System', icon: 'ti-device-desktop' },
  ];

  // Language options
  public languageOptions: LanguageOption[] = [
    { value: 'en', label: 'English', nativeName: 'English' },
    { value: 'uk', label: 'Ukrainian', nativeName: 'Українська' },
    { value: 'nl', label: 'Dutch', nativeName: 'Nederlands' },
  ];

  // Current settings
  public currentTheme = signal<'dark' | 'light' | 'system'>('dark');
  public currentLanguage = signal<'en' | 'uk' | 'nl'>('en');

  // Methods to update settings
  public setTheme(theme: 'dark' | 'light' | 'system'): void {
    this.currentTheme.set(theme);
    console.log('Theme changed:', theme);
    // Here you would implement the actual theme change logic
  }

  public setLanguage(language: 'en' | 'uk' | 'nl'): void {
    this.currentLanguage.set(language);
    console.log('Language changed:', language);
    // Here you would implement the actual language change logic
  }
}
