import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { OpenProjectPageComponent } from '../../../open-project-page/open-project-page.component';

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [CommonModule, OpenProjectPageComponent],
  template: `
    <div class="project-dialog-wrapper">
      <div class="dialog-header">
        <div class="icon-and-title">
          <i class="ti ti-folder"></i>
          <span class="title">{{ data.projectName }}</span>
        </div>
        <div class="header-actions">
          <div class="close-action">
            <span class="esc-label">ESC</span>
            <i class="ti ti-x close-icon" (click)="dialogRef.close()"></i>
          </div>
        </div>
      </div>
      <div class="dialog-content">
        <app-open-project-page
          [showHeader]="true"
          [inputProjectId]="data.projectId"
        >
        </app-open-project-page>
      </div>
    </div>
  `,
  styleUrls: ['./project-dialog.component.scss'],
})
export class ProjectDialogComponent {
  dialogRef = inject(DialogRef);

  constructor(
    @Inject(DIALOG_DATA)
    public data: {
      projectId: number;
      projectName: string;
    }
  ) {}
}
