import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { ToastMessage, ToastService } from '../toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        [@toastAnimation]="'visible'"
        class="toast-item"
        [ngClass]="toast.type"
        (click)="closeToast(toast.id)"
      >
        <div class="toast-content">
          <i [class]="getIconClass(toast.type)"></i>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button
          class="toast-close-btn"
          (click)="closeToast(toast.id); $event.stopPropagation()"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        max-width: 350px;
        width: 350px;
        max-height: 80vh;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      .toast-item {
        width: 100%;
        padding: 12px 16px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background-color: #1e1e1e;
        color: #e0e0e0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition: transform 0.2s ease, background-color 0.2s ease;
        border: 1px solid #2a2a2a;

        .toast-content {
          i {
            margin-right: 16px;
          }
        }

        &:hover {
          transform: translateY(-2px);
          background-color: #2a2a2a;
        }

        &.success {
          i {
            color: #4caf50;
          }
        }

        &.error {
          i {
            color: #f44336;
          }
        }

        &.warning {
          i {
            color: #ff9800;
          }
        }

        &.info {
          i {
            color: #2196f3;
          }
        }
      }

      message {
        font-size: 14px;
        color: #a0a0a0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.4;
        max-height: 4.2em;
        word-break: break-word;
        min-width: 0;
      }

      .toast-close-btn {
        background: transparent;
        border: none;
        color: #a0a0a0;
        font-size: 14px;
        cursor: pointer;
        padding: 4px;
        margin-left: 10px;
        flex-shrink: 0;

        &:hover {
          color: #e0e0e0;
        }
      }
    `,
  ],
  animations: [
    trigger('toastAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(100%)',
        }),
        animate('300ms ease-out'),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({
            opacity: 0,
            transform: 'translateX(100%)',
          })
        ),
      ]),
    ]),
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  public toasts: ToastMessage[] = [];
  private subscription = new Subscription();

  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.toastService.toasts$.subscribe((toasts) => {
        this.toasts = toasts;
        this.cdr.markForCheck();
      })
    );
  }

  public closeToast(id: number): void {
    this.toastService.remove(id);
  }

  public getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-bell';
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
