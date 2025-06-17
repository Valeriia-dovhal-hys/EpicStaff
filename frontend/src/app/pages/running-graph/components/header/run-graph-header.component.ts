import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { GraphSessionStatus } from '../../../../services/graph-sessions-status.service';

@Component({
  selector: 'app-running-graph-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="header">
      <div class="breadcrumbs">
        <a class="flow-link" routerLink="/flows">Flows</a>
        <span class="slash">/</span>
        <span class="flow-name">{{ graphName || '...' }}</span>
        <span class="slash">/</span>
        <span class="status-badge" [ngClass]="statusClass">
          <i [ngClass]="statusIcon" aria-hidden="true"></i>
          {{ statusText }}
        </span>
      </div>
      <div class="view-options"></div>
      <div class="actions"></div>
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

        .breadcrumbs {
          display: flex;
          align-items: center;

          .flow-link,
          .flow-name,
          .slash {
            font-size: 24px;
            font-weight: 400;
            letter-spacing: -0.02em;
            line-height: 1;
            margin: 0;
            padding: 0;
          }

          .flow-link {
            color: #999;
            text-decoration: none;
            cursor: pointer;
            font-size: 24px;
            &:hover {
              color: var(--accent-color);
              text-decoration: underline;
            }
          }

          .slash {
            color: #999;
            margin: 0 0.5rem;
          }

          .flow-name {
            color: var(--white);
          }

          .status-badge {
            margin-left: 0.5rem;
            margin-top: 0.4rem;
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            gap: 6px;

            i {
              font-size: 14px;
            }
          }
        }
      }

      /* Status badge colors - matched with the dialog styling */
      .status-running {
        background-color: rgba(41, 121, 255, 0.15);
        color: #5e9eff;
        animation: pulse 1.5s infinite ease-in-out;
      }

      .status-error {
        background-color: rgba(255, 76, 76, 0.15);
        color: #ff7a7a;
      }

      .status-waiting {
        background-color: rgba(255, 170, 0, 0.15);
        color: #ffc14d;
      }

      .status-complete {
        background-color: rgba(80, 205, 137, 0.15);
        color: #6bdb9a;
      }

      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
        100% {
          opacity: 1;
        }
      }
    `,
  ],
})
export class RunningGraphHeaderComponent {
  @Input() graphId: string | null | undefined = null;
  @Input() sessionId: string | null | undefined = null;
  @Input() graphName: string | null | undefined = null;
  @Input() sessionStatus: GraphSessionStatus | null = null;

  get statusText(): string {
    if (!this.sessionStatus) return '';
    switch (this.sessionStatus) {
      case GraphSessionStatus.RUNNING:
        return 'Running';
      case GraphSessionStatus.ERROR:
        return 'Error';
      case GraphSessionStatus.ENDED:
        return 'Completed';
      case GraphSessionStatus.WAITING_FOR_USER:
        return 'Waiting for User';
      default:
        return 'Unknown';
    }
  }

  get statusClass(): string {
    if (!this.sessionStatus) return '';
    switch (this.sessionStatus) {
      case GraphSessionStatus.RUNNING:
        return 'status-running';
      case GraphSessionStatus.ERROR:
        return 'status-error';
      case GraphSessionStatus.ENDED:
        return 'status-complete';
      case GraphSessionStatus.WAITING_FOR_USER:
        return 'status-waiting';
      default:
        return '';
    }
  }

  get statusIcon(): string {
    if (!this.sessionStatus) return '';
    switch (this.sessionStatus) {
      case GraphSessionStatus.RUNNING:
        return 'ti ti-player-play';
      case GraphSessionStatus.ERROR:
        return 'ti ti-alert-triangle';
      case GraphSessionStatus.ENDED:
        return 'ti ti-check';
      case GraphSessionStatus.WAITING_FOR_USER:
        return 'ti ti-hourglass';
      default:
        return '';
    }
  }
}
