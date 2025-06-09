import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { Tool } from '../../shared/models/tool.model';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tool-selector-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    CommonModule,
    MatCheckboxModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './tool-selector-dialog.component.html',
  styleUrls: ['./tool-selector-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolSelectorComponent implements OnDestroy {
  // Data
  public tools: Tool[] = [];
  public selectedTools: Set<Tool> = new Set<Tool>();

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { selectedTools?: Tool[]; toolsData: Tool[] },
    private dialogRef: MatDialogRef<ToolSelectorComponent>,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize tools with the passed toolsData
    this.tools = data.toolsData;
    this.selectedTools = new Set<Tool>(data.selectedTools || []);
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public toggleSelection(tool: Tool): void {
    if (this.isSelected(tool)) {
      this.selectedTools.delete(tool);
    } else {
      this.selectedTools.add(tool);
    }
    // No need to call markForCheck() here; event handler triggers change detection
  }

  public isSelected(tool: Tool): boolean {
    return this.selectedTools.has(tool);
  }

  get selectedToolsArray(): Tool[] {
    return Array.from(this.selectedTools);
  }

  /**
   * Confirms the selection and closes the dialog, passing back the selected tools.
   */
  public onConfirm(): void {
    const selectedToolsArray = this.selectedToolsArray;
    this.dialogRef.close(selectedToolsArray);
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
