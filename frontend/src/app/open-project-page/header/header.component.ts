import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { RunGraphService } from '../../services/run-graph-session.service';
import { map, takeUntil } from 'rxjs/operators';
import { EditTitleDialogComponent } from './edit-name-dialog/edit-title-dialog.component';
import { ProjectStateService } from '../services/project-state.service';
import { ToastService } from '../../services/notifications/toast.service';
import { Subject } from 'rxjs';
import { GetProjectRequest } from '../../pages/projects-page/models/project.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, FormsModule, DialogModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  public project: GetProjectRequest | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private runGraphService: RunGraphService,
    private router: Router,
    private dialog: Dialog,
    private projectStateService: ProjectStateService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to project state changes
    this.projectStateService.project$
      .pipe(takeUntil(this.destroy$))
      .subscribe((project) => {
        this.project = project;
        // Mark for check since we're using OnPush strategy
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRunClick(): void {
    // If project ID is available, call the service
    // if (this.project?.id) {
    //   this.runGraphService
    //     .runProject(this.project.id)
    //     .pipe(
    //       map((result) => {
    //         // Navigate to the new route format with graph ID and session ID
    //         this.router.navigate([
    //           '/graph',
    //           result.graphId,
    //           'session',
    //           result.sessionId,
    //         ]);
    //         return result;
    //       })
    //     )
    //     .subscribe({
    //       error: (error) => {
    //         console.error('Error running project:', error);
    //         this.toastService.error('Failed to run project');
    //       },
    //     });
    // } else {
    //   console.error('Project ID is not defined');
    //   this.toastService.error('No project selected');
    // }
  }
  setProcessType(type: 'sequential' | 'hierarchical'): void {
    if (this.project?.process !== type && this.project?.id) {
      // Update the project through the service
      this.projectStateService
        .updateProjectField(this.project.id, 'process', type)
        .subscribe({
          next: (updatedProject) => {
            // This line is technically not needed since the service already updates the subject,
            // but it makes the code more explicit and self-documenting
            this.project = updatedProject;
            this.cdr.markForCheck(); // Ensure UI updates in OnPush change detection
            this.toastService.success('Process type updated successfully');
          },
          error: (error) => {
            console.error('Error updating process type:', error);
            this.toastService.error('Failed to update process type');
          },
        });
    }
  }

  openEditTitleDialog(): void {
    if (!this.project) return;

    const dialogRef = this.dialog.open(EditTitleDialogComponent, {
      width: '400px',
      data: { title: this.project.name },
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.closed.subscribe((result) => {
      if (result && typeof result === 'string' && this.project?.id) {
        this.updateProjectTitle(this.project.id, result);
      }
    });
  }

  private updateProjectTitle(projectId: number, newTitle: string): void {
    this.projectStateService
      .updateProjectField(projectId, 'name', newTitle)
      .subscribe({
        next: () => {
          this.toastService.success('Project name updated successfully');
        },
        error: (error) => {
          console.error('Error updating project title:', error);
          this.toastService.error('Failed to update project name');
        },
      });
  }
}
