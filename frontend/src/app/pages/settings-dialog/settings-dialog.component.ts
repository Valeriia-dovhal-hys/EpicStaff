import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { DefaultsTabComponent } from './components/defaults-tab/defaults-tab.component';
import { ModelsTabComponent } from './components/models-tab/models-tab.component';
import { PreferencesTabComponent } from './components/preferences-tab/preferences-tab.component';
import { QuickStartTabComponent } from './components/quickstart-tab/quick-start-tab.component';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    QuickStartTabComponent,
    DefaultsTabComponent,
    ModelsTabComponent,
    PreferencesTabComponent,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">Settings</h2>
        <button class="close-button" (click)="onCancel()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="dialog-content">
        <div class="tabs-header">
          <button
            *ngFor="let tab of tabs"
            class="tab-button"
            [class.active]="activeTab === tab.id"
            (click)="setActiveTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <app-quick-start-tab
            *ngIf="activeTab === 'quickstart'"
          ></app-quick-start-tab>
          <app-defaults-tab *ngIf="activeTab === 'defaults'"></app-defaults-tab>
          <app-models-tab *ngIf="activeTab === 'models'"></app-models-tab>
          <app-preferences-tab
            *ngIf="activeTab === 'preferences'"
          ></app-preferences-tab>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialogComponent {
  @ViewChild(QuickStartTabComponent) quickStartTab?: QuickStartTabComponent;

  public tabs = [
    { id: 'quickstart', label: 'QuickStart' },
    { id: 'defaults', label: 'Defaults' },
    { id: 'models', label: 'Models' },
    { id: 'preferences', label: 'Preferences' },
  ];

  public activeTab = 'quickstart';
  public isSaving = false;

  constructor(private dialogRef: DialogRef<string>) {}

  public setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  public onCancel(): void {
    if (this.isSaving) return;
    this.dialogRef.close();
  }
}
