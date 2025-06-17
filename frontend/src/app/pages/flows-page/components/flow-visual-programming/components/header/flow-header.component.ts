import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { RunGraphService } from '../../../../../../services/run-graph-session.service';
import { Dialog as CdkDialog } from '@angular/cdk/dialog';
import { GraphSessionsDialogComponent } from '../../../flow-item/graph-sesions-dialog/graph-sessions-dialog.component';
import { ToastService } from '../../../../../../services/notifications/toast.service';

@Component({
  selector: 'app-flow-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="header">
      <div class="title-search">
        <h1 class="title">
          <a class="flow-link" routerLink="/flows">Flows</a>
        </h1>
        <span class="slash">/</span>
        <div class="graph-name">{{ graphName ?? 'Loading...' }}</div>
      </div>
      <div class="header-actions">
        <button class="sessions-button" (click)="onViewSessions()">
          <i class="ti ti-history"></i> Sessions
        </button>
        <button class="save-button" (click)="onSave()">
          <i class="ti ti-device-floppy"></i> Save
        </button>
        <button class="run-button" (click)="onRun()">
          <i class="ti ti-player-play"></i> Run
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 4.3rem !important;
        width: 100%;
        padding: 0 3.8rem;
        border-bottom: 1px solid var(--gray-800);

        .title-search {
          display: flex;
          align-items: center;
          position: relative;

          .title {
            font-size: 24px;
            font-weight: 400;
            letter-spacing: -0.02em;
            line-height: 1.2;
            color: var(--white);
            padding: 0 !important;
            margin: 0 !important;

            .flow-link {
              color: #999;
              text-decoration: none;
              cursor: pointer;

              &:hover {
                color: var(--accent-color);
                text-decoration: underline;
              }
            }
          }

          .slash {
            color: #999;
            margin: 0 0.5rem;
            font-size: 24px;
            font-weight: 400;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .graph-name {
            font-size: 24px;
            font-weight: 400;
            letter-spacing: -0.02em;
            line-height: 1.2;
            color: var(--white);
          }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;

          button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
          }

          .sessions-button {
            background-color: transparent;
            color: var(--accent-color);
            border: none;

            &:hover {
              background-color: rgba(154, 115, 175, 0.1);
            }
          }

          .save-button {
            background-color: transparent;
            color: var(--accent-color);
            border: 1px solid var(--accent-color);

            &:hover {
              background-color: rgba(154, 115, 175, 0.1);
              box-shadow: 0 0 0 1px var(--accent-color);
            }
          }

          .run-button {
            background-color: var(--accent-color);
            color: white;
            border: 1px solid var(--accent-color);

            &:hover {
              background-color: rgba(154, 115, 175, 0.1);
              box-shadow: 0 0 0 1px var(--accent-color);
            }
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowHeaderComponent {
  @Input() graphName?: string;
  @Input() graphId?: number;
  @Output() save = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() viewSessions = new EventEmitter<void>();

  constructor(
    private runGraphService: RunGraphService,
    private router: Router,
    private dialog: CdkDialog,
    private toastService: ToastService
  ) {}

  onSave() {
    this.save.emit();
  }

  onBack() {
    this.back.emit();
  }

  onViewSessions() {
    this.viewSessions.emit();
    if (this.graphId && this.graphName) {
      const dialogRef = this.dialog.open(GraphSessionsDialogComponent, {
        backdropClass: 'dark-blur-backdrop',
        data: {
          graphId: this.graphId,
          graphName: this.graphName,
        },
      });
      dialogRef.closed.subscribe(() => {});
    }
  }

  onRun() {
    if (this.graphId) {
      this.runGraphService.runGraph(this.graphId).subscribe({
        next: (response) => {
          this.router.navigate([
            'graph',
            this.graphId,
            'session',
            response.session_id,
          ]);
        },
        error: (error) => {
          this.toastService.error(
            `Failed to run graph: ${error?.error.error || 'Unknown error'}`
          );
          console.error('Failed to run graph:', error);
        },
      });
    }
  }
}
