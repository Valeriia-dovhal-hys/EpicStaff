import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SpinnerComponent } from '../../../../../../shared/components/spinner-type2/spinner.component';
import { AppIconComponent } from '../../../../../../shared/components/app-icon/app-icon.component';
import { Router } from '@angular/router';
import { RunGraphService } from '../../../../../../services/run-graph-session.service';
import { Dialog as CdkDialog } from '@angular/cdk/dialog';
import { ToastService } from '../../../../../../services/notifications/toast.service';

@Component({
  selector: 'app-flow-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent, AppIconComponent],
  template: `
    <div class="header">
      <div class="title-search">
        <h1 class="title">
          <div class="flows-prefix" routerLink="/flows">
            <app-icon [icon]="'ui/arrow-left'" size="20" class="back-arrow" />
            <span>Flows</span>
          </div>
          <span class="slash">/</span>
          <div class="graph-name project-link">
            {{ graphName ?? 'Loading...' }}
          </div>
        </h1>
      </div>
      <div class="header-actions">
        <button class="sessions-button" (click)="onViewSessions()">
          <i class="ti ti-history"></i> Sessions
        </button>
        <button
          class="save-button"
          [disabled]="isSaving || isRunning"
          (click)="onSave()"
        >
          @if(isSaving) {
          <app-spinner [size]="16"></app-spinner>
          } @else {
          <i class="ti ti-device-floppy"></i>
          } Save
        </button>
        <button
          class="run-button"
          [disabled]="isSaving || isRunning"
          (click)="onRun()"
        >
          @if(isRunning) {
          <app-spinner [size]="16"></app-spinner>
          } @else {
          <i class="ti ti-player-play-filled"></i>
          } Run
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
        height: 5rem !important;
        width: 100%;
        padding: 0 3rem;
        border-bottom: 1px solid var(--color-divider-subtle);

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
            display: flex;
            align-items: center;

            .flows-prefix {
              color: rgba(255, 255, 255, 0.6);
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              position: relative;

              .back-arrow {
                margin-top: 3px;
                opacity: 1;
                transform: translateX(0);
                transition: all 0.3s ease;
              }

              span {
                line-height: 1;
              }

              &:hover {
                color: rgba(255, 255, 255, 0.9);
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
            justify-content: center;
            gap: 0.5rem;
            padding: 0 0.75rem;
            height: 36px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease-in-out;

            &:disabled {
              cursor: not-allowed;
              opacity: 0.7;
            }

            i.ti-spin {
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
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
            }
          }

          .run-button {
            background-color: var(--accent-color);
            color: white;
            border: 1px solid var(--accent-color);

            &:active {
              background-color: var(--accent-color);
            }
          }
        }
      }
      .graph-name.project-link {
        cursor: pointer;
        transition: text-decoration 0.2s;
      }
      .graph-name.project-link:hover {
        text-decoration: underline;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowHeaderComponent {
  @Input() graphName?: string;
  @Input() graphId?: number;
  @Input() isSaving = false;
  @Input() isRunning = false;
  @Output() save = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() viewSessions = new EventEmitter<void>();
  @Output() run = new EventEmitter<void>();

  constructor(private router: Router) {}

  onSave() {
    this.save.emit();
  }

  onBack() {
    this.back.emit();
  }

  onViewSessions() {
    this.viewSessions.emit();
  }

  onRun() {
    this.run.emit();
  }
}
