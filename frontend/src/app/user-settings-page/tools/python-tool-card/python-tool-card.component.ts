import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgIf } from '@angular/common';
import { PythonCodeToolCard } from '../models/pythonTool-card.model';

@Component({
  selector: 'app-python-tool-card',
  template: `
    <div class="tool-card" [ngClass]="{ disabled: !tool.enabled }">
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

          <!-- Configure Button -->
          <button
            mat-icon-button
            class="configure-icon"
            (click)="onConfigureClick()"
            aria-label="Configure tool"
          >
            <mat-icon>tune</mat-icon>
          </button>

          <!-- Delete Button -->
          <button
            mat-icon-button
            class="delete-icon"
            (click)="onDeleteClick()"
            aria-label="Delete tool"
          >
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <div class="tool-logo-wrapper">
        <div class="python-logo">
          <mat-icon>code</mat-icon>
        </div>
      </div>

      <div class="tool-name">{{ tool.name }}</div>
      <div class="tool-description">{{ tool.description }}</div>
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
          pointer-events: none;

          .tool-toggle {
            pointer-events: auto;
          }
        }

        .tool-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;

          .tool-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 500;
            letter-spacing: 0.5px;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background-color: rgba(104, 95, 255, 0.15);
            color: var(--accent-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: background-color 0.2s ease;

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

            .configure-icon,
            .delete-icon {
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
                background-color: rgba(104, 95, 255, 0.15);
                color: var(--accent-color);
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

            .delete-icon {
              &:hover {
                color: #ff5252;
                background-color: rgba(255, 82, 82, 0.15);
              }
            }
          }
        }

        .tool-logo-wrapper {
          display: flex;
          justify-content: center;
          margin: 0.75rem 0;

          .python-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: rgba(104, 95, 255, 0.15);
            padding: 8px;
            border: 1px solid rgba(104, 95, 255, 0.3);
            transition: transform 0.2s ease, background-color 0.2s ease;

            mat-icon {
              font-size: 28px;
              height: 28px;
              width: 28px;
              color: var(--accent-color);
            }
          }
        }

        .tool-name {
          font-size: 1.125rem;
          font-weight: 500;
          color: var(--white);
          line-height: 1.5rem;
          text-align: center;
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
          margin-top: auto;
          text-align: center;
        }

        &:hover {
          border-color: var(--accent-color);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(104, 95, 255, 0.1);

          .tool-name {
            color: var(--accent-color);
          }

          .tool-logo-wrapper .python-logo {
            transform: scale(1.05);
            background-color: rgba(104, 95, 255, 0.25);
          }

          .tool-label {
            background-color: rgba(104, 95, 255, 0.25);
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
  imports: [MatIconModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PythonToolCardComponent {
  @Input() public tool!: PythonCodeToolCard;
  @Output() public toolEnabledUpdated = new EventEmitter<PythonCodeToolCard>();
  @Output() public toolFavoriteUpdated = new EventEmitter<PythonCodeToolCard>();
  @Output() public configureClicked = new EventEmitter<PythonCodeToolCard>();
  @Output() public toolDeleted = new EventEmitter<PythonCodeToolCard>();

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
  }

  public onConfigureClick(): void {
    this.configureClicked.emit(this.tool);
  }

  public onDeleteClick(): void {
    this.toolDeleted.emit(this.tool);
  }
}
