import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ToggleFieldOption {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface NumberFieldOption {
  id: string;
  name: string;
  description: string;
  value: number;
}

@Component({
  selector: 'app-field-agent-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="field-agent-content">
      <div class="field-categories">
        <div class="category">
          <div class="category-header">
            <span>Advanced Settings</span>
          </div>
          <div class="field-list">
            <div
              *ngFor="let field of advancedSettings"
              class="field-item"
              [class.selected]="field.selected"
            >
              <div class="field-details">
                <div class="field-name">{{ field.name }}</div>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-status">
                <label class="toggle">
                  <input
                    type="checkbox"
                    [checked]="field.selected"
                    (change)="toggleAdvancedSetting(field)"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="category">
          <div class="category-header">
            <span>Execution Parameters</span>
          </div>
          <div class="field-list">
            <div *ngFor="let field of executionParameters" class="field-item">
              <div class="field-details">
                <div class="field-name">{{ field.name }}</div>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-status execution-input">
                <input
                  type="number"
                  [(ngModel)]="field.value"
                  (change)="updateExecutionParameter(field)"
                  [min]="0"
                  class="number-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .field-agent-content {
        .field-categories {
          .category {
            margin-bottom: 20px;

            &:last-child {
              margin-bottom: 0;
            }

            .category-header {
              margin-bottom: 8px;
              font-size: 13px;
              font-weight: 500;
              color: rgba(255, 255, 255, 0.8);
            }

            .field-list {
              display: flex;
              flex-direction: column;
              gap: 8px;

              .field-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background-color: var(--gray-800);
                border-radius: 4px;
                border: 1px solid transparent;

                &.required {
                  background-color: rgba(235, 87, 87, 0.1);
                  border-color: rgba(235, 87, 87, 0.3);
                }

                &.selected {
                  background-color: rgba(101, 98, 245, 0.1);
                  border-color: var(--accent-color);
                }

                .field-details {
                  .field-name {
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: rgba(255, 255, 255, 0.9);
                  }

                  .field-description {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                  }
                }

                .field-status {
                  .required-badge {
                    font-size: 11px;
                    padding: 2px 6px;
                    background-color: rgba(235, 87, 87, 0.2);
                    color: rgb(235, 87, 87);
                    border-radius: 3px;
                    font-weight: 500;
                  }

                  &.execution-input {
                    display: flex;
                    align-items: center;
                    gap: 8px;

                    .number-input {
                      width: 80px;
                      height: 28px;
                      background-color: var(--gray-700);
                      border: 1px solid var(--gray-600);
                      border-radius: 4px;
                      color: white;
                      padding: 0 8px;
                      font-size: 12px;
                      text-align: center;
                    }
                  }

                  .toggle {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 20px;

                    input {
                      opacity: 0;
                      width: 0;
                      height: 0;

                      &:checked + .slider {
                        background-color: var(--accent-color);
                      }

                      &:checked + .slider:before {
                        transform: translateX(20px);
                      }
                    }

                    .slider {
                      position: absolute;
                      cursor: pointer;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      background-color: var(--gray-600);
                      transition: 0.3s;
                      border-radius: 34px;

                      &:before {
                        position: absolute;
                        content: '';
                        height: 16px;
                        width: 16px;
                        left: 2px;
                        bottom: 2px;
                        background-color: white;
                        transition: 0.3s;
                        border-radius: 50%;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAgentSectionComponent implements OnInit {
  public advancedSettings: ToggleFieldOption[] = [];
  public executionParameters: NumberFieldOption[] = [];

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    // Initialize fields based on the Agent model
    this.loadFieldOptions();
  }

  public toggleAdvancedSetting(field: ToggleFieldOption): void {
    field.selected = !field.selected;
    this.changeDetectorRef.markForCheck();
    // Here you would typically call a service to save this selection
  }

  public updateExecutionParameter(field: NumberFieldOption): void {
    // Handle updating the execution parameter
    // You might want to add validation here
    this.changeDetectorRef.markForCheck();
  }

  private loadFieldOptions(): void {
    // Advanced Settings (boolean toggles)
    this.advancedSettings = [
      {
        id: 'allow_delegation',
        name: 'Allow Delegation',
        description: 'Enables the agent to delegate tasks to other agents',
        selected: false,
      },
      {
        id: 'memory',
        name: 'Memory',
        description: 'Enables memory capabilities for the agent',
        selected: false,
      },
      {
        id: 'cache',
        name: 'Cache',
        description: 'Enables caching of agent responses',
        selected: false,
      },
      {
        id: 'allow_code_execution',
        name: 'Allow Code Execution',
        description: 'Permits the agent to execute code',
        selected: false,
      },
      {
        id: 'respect_context_window',
        name: 'Respect Context Window',
        description: 'Ensures the agent stays within the context window limits',
        selected: false,
      },
    ];

    // Execution Parameters (number inputs)
    this.executionParameters = [
      {
        id: 'max_iter',
        name: 'Max Iterations',
        description: 'Maximum number of iterations the agent can perform',
        value: 10,
      },
      {
        id: 'max_rpm',
        name: 'Max RPM',
        description: 'Maximum requests per minute',
        value: 5,
      },
      {
        id: 'max_execution_time',
        name: 'Max Execution Time',
        description: 'Maximum execution time in seconds',
        value: 300,
      },
      {
        id: 'max_retry_limit',
        name: 'Max Retry Limit',
        description: 'Maximum number of retry attempts',
        value: 3,
      },
    ];
  }
}
