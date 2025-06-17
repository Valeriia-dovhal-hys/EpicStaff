import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  DestroyRef,
  computed,
} from '@angular/core';
import { GetPythonCodeToolRequest } from '../../../../models/python-code-tool.model';
import { LoadingSpinnerComponent } from '../../../../../../shared/components/loading-spinner/loading-spinner.component';
import { CustomToolCardComponent } from './components/custom-tool-card/custom-tool-card.component';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomToolsStorageService } from '../../../../services/custom-tools/custom-tools-storage.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { CustomToolDialogComponent } from '../../../../../../user-settings-page/tools/custom-tool-editor/custom-tool-dialog.component';
import { ToastService } from '../../../../../../services/notifications/toast.service';
import { ConfirmationDialogService } from '../../../../../../shared/components/cofirm-dialog/confimation-dialog.service';

@Component({
  selector: 'app-custom-tools',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './custom-tools.component.html',
  styleUrls: ['./custom-tools.component.scss'],
  imports: [
    LoadingSpinnerComponent,
    CustomToolCardComponent,
    DialogModule,
    CommonModule,
  ],
})
export class CustomToolsComponent implements OnInit {
  private readonly customToolsStorageService = inject(
    CustomToolsStorageService
  );
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(Dialog);
  private readonly toastService = inject(ToastService);
  private readonly confirmationDialogService = inject(
    ConfirmationDialogService
  );

  public readonly error = signal<string | null>(null);
  public readonly tools = computed(() =>
    this.customToolsStorageService.filteredTools()
  );
  public readonly isLoaded = computed(() =>
    this.customToolsStorageService.isToolsLoaded()
  );

  public ngOnInit(): void {
    this.customToolsStorageService
      .getTools()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tools) => {
          console.log(
            `✅ Custom tools loaded: ${tools.length} tools available`
          );
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(
            'Failed to load custom tools. Please try again later.'
          );
          console.error('❌ Error loading custom tools:', err);
        },
      });
  }

  public onConfigure(tool: GetPythonCodeToolRequest): void {
    const dialogRef = this.dialog.open<GetPythonCodeToolRequest>(
      CustomToolDialogComponent,
      {
        data: {
          pythonTools: this.tools(),
          selectedTool: tool,
        },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result) {
        // Update the tool in storage with the new values
        this.customToolsStorageService.updateToolInStorage(result);
      }
    });
  }

  public onDelete(tool: GetPythonCodeToolRequest): void {
    this.confirmationDialogService
      .confirmDelete(tool.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.customToolsStorageService
            .deleteTool(tool.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.toastService.success(
                  `Tool "${tool.name}" has been deleted successfully.`
                );
                console.log(`✅ Tool "${tool.name}" deleted successfully`);
              },
              error: (err: HttpErrorResponse) => {
                this.toastService.error(
                  `Failed to delete tool "${tool.name}". Please try again.`
                );
                console.error('❌ Error deleting tool:', err);
              },
            });
        }
      });
  }
}
