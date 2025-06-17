import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgIf } from '@angular/common';
import { ToolCard } from '../models/tool-card.model';
import { ToastService } from '../../../services/notifications/toast.service';

@Component({
  selector: 'app-tool-card',
  template: `
    <div class="tool-card" [ngClass]="{ disabled: !tool.enabled }">
      <div class="tool-content">
        <div class="tool-details">
          <div class="tool-header">
            <div class="tool-label">{{ tool.label }}</div>
            <div class="tool-controls">
              <!-- On/Off Toggle Switch -->
              <div class="tool-toggle">
                <label class="switch">
                  <input
                    type="checkbox"
                    [checked]="tool.enabled"
                    (change)="toggleEnabled()"
                    (keydown.enter)="$event.preventDefault(); toggleEnabled()"
                  />
                  <span class="slider"></span>
                </label>
              </div>

              <!-- Favorite Star Button -->
              <div
                class="icon-wrapper"
                role="button"
                tabindex="0"
                (click)="toggleFavorite()"
                (keydown.space)="toggleFavorite(); $event.preventDefault()"
                (keydown.enter)="toggleFavorite()"
              >
                <mat-icon
                  class="star-icon"
                  [fontSet]="
                    tool.favorite ? 'material-icons' : 'material-icons-outlined'
                  "
                >
                  {{ tool.favorite ? 'star' : 'star_outline' }}
                </mat-icon>
              </div>

              <!-- Configuration Button -->
              <button
                *ngIf="tool.tool_fields.length > 0"
                mat-icon-button
                class="configure-icon"
                (click)="onConfigureClick()"
              >
                <mat-icon>tune</mat-icon>
              </button>
            </div>
          </div>

          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-description">{{ tool.description }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .tool-card {
        border-radius: 0.75rem;
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        background-color: var(--gray-900);
        border: 1px solid var(--gray-750);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease-in-out;
        position: relative;
        height: 200px;
        overflow: hidden;

        &.disabled {
          opacity: 0.6;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.25);
            border-radius: 0.75rem;
            pointer-events: none;
            z-index: 1;
          }
        }

        .tool-content {
          display: flex;
          height: 100%;
        }

        .tool-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .tool-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;

          .tool-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            width: fit-content;
            font-weight: 500;
            letter-spacing: 0.5px;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background-color: rgba(104, 95, 255, 0.15);
            color: var(--accent-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &::before {
              content: '#';
              margin-right: 2px;
            }
          }

          .tool-controls {
            display: flex;
            align-items: center;
            gap: 0.35rem;

            .icon-wrapper {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 8px;
              border-radius: 50%;
              cursor: pointer;
              transition: background-color 0.2s;

              &:hover {
                background-color: rgba(104, 95, 255, 0.15);
              }

              .star-icon {
                font-size: 22px;
                height: 22px;
                width: 22px;
                color: #ffd93d;
                display: flex;
                align-items: center;
                justify-content: center;

                &.material-icons-outlined {
                  color: var(--gray-500);
                }
              }
            }

            .tool-toggle {
              display: flex;
              align-items: center;
              margin-right: 4px;
              position: relative;
              z-index: 10;

              .switch {
                position: relative;
                display: inline-block;
                width: 36px;
                height: 20px;

                &:hover .slider {
                  background-color: var(--gray-700);
                }

                &:hover input:checked + .slider {
                  background-color: rgba(104, 95, 255, 0.8);
                }
              }

              .switch input {
                opacity: 0;
                width: 0;
                height: 0;

                &:focus-visible + .slider {
                  outline: 2px solid var(--accent-color);
                  outline-offset: 2px;
                }
              }

              .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--gray-700);
                border: 1px solid var(--gray-600);
                border-radius: 34px;
                transition: 0.3s;

                &:before {
                  position: absolute;
                  content: '';
                  height: 14px;
                  width: 14px;
                  left: 2px;
                  bottom: 2px;
                  background-color: var(--gray-200);
                  transition: transform 0.3s ease;
                  border-radius: 50%;
                }
              }

              input:checked + .slider {
                background-color: var(--accent-color);
                border-color: var(--accent-color);

                &:before {
                  transform: translateX(16px);
                  background-color: var(--white);
                }
              }
            }

            .configure-icon {
              color: var(--gray-400);
              background: none;
              border: none;
              cursor: pointer;
              padding: 8px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;

              &:hover {
                color: var(--accent-color);
                background-color: rgba(104, 95, 255, 0.15);
              }

              &:focus {
                outline: none;
              }

              &:focus-visible {
                outline: 2px solid var(--accent-color);
                outline-offset: 2px;
              }

              mat-icon {
                font-size: 20px;
              }
            }
          }
        }

        .tool-name {
          font-size: 1.125rem;
          font-weight: 500;
          color: #ededed;
          line-height: 1.5rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s ease;
        }

        .tool-description {
          font-size: 0.875rem;
          color: var(--gray-400);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
          margin-top: 0.5rem;
        }

        &:hover {
          border-color: var(--accent-color);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(104, 95, 255, 0.1);

          .tool-name {
            color: var(--accent-color);
          }

          &::after {
            opacity: 1;
          }
        }

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at top right,
            rgba(104, 95, 255, 0.1),
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
      }
    `,
  ],
  standalone: true,
  imports: [MatIconModule, NgIf, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolCardComponent implements OnInit {
  @Input() public tool!: ToolCard;
  @Output() public toolEnabledUpdated = new EventEmitter<ToolCard>();
  @Output() public toolFavoriteUpdated = new EventEmitter<ToolCard>();
  @Output() public configureClicked = new EventEmitter<ToolCard>();

  ngOnInit(): void {
    // Component initialization logic
  }
  constructor(private toastService: ToastService) {}

  public toggleEnabled(): void {
    this.toolEnabledUpdated.emit({
      ...this.tool,
      enabled: !this.tool.enabled,
    });
  }

  public toggleFavorite(): void {
    this.toolFavoriteUpdated.emit({
      ...this.tool,
      favorite: !this.tool.favorite,
    });
    this.toastService.info(`Add to favorite will be implented soon`);
  }

  public onConfigureClick(): void {
    this.configureClicked.emit(this.tool);
  }
}
