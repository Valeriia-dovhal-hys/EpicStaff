import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';

interface FlowRenameData {
  flowName: string;
}

@Component({
  selector: 'app-flow-rename-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-container">
      <h2 class="dialog-title">Rename Flow</h2>
      <div class="dialog-content">
        <div class="form-group">
          <label for="flowName">Flow Name</label>
          <input
            type="text"
            id="flowName"
            class="form-control"
            [(ngModel)]="newName"
            placeholder="Enter flow name"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="dialog-actions">
        <app-button type="ghost" (click)="cancel()">Cancel</app-button>
        <app-button type="primary" [disabled]="!isValid()" (click)="save()"
          >Save</app-button
        >
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        background: var(--color-sidenav-background);
        border-radius: 12px;
        padding: 1.5rem;
        width: 400px;
        max-width: 100%;
      }

      .dialog-title {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: var(--color-text-primary);
        font-size: 1.25rem;
        font-weight: 600;
      }

      .dialog-content {
        margin-bottom: 1.5rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--color-text-secondary);
        font-size: 0.875rem;
      }

      .form-control {
        width: 100%;
        padding: 0.625rem;
        background-color: var(--color-input-background);
        border: 1px solid var(--color-input-border);
        border-radius: 6px;
        color: var(--color-text-primary);
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--accent-color);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    `,
  ],
})
export class FlowRenameDialogComponent {
  private readonly dialogRef = inject(DialogRef);
  private readonly data = inject<FlowRenameData>(DIALOG_DATA);

  public newName = this.data.flowName;

  public isValid = signal<boolean>(true);

  ngOnInit(): void {
    this.validateName();
  }

  private validateName(): void {
    this.isValid.set(!!this.newName && this.newName.trim().length > 0);
  }

  public save(): void {
    this.validateName();
    if (this.isValid()) {
      this.dialogRef.close(this.newName);
    }
  }

  public cancel(): void {
    this.dialogRef.close();
  }
}
